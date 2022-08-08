#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "std/private/default_gc.h"
#include "std/tsobject.h"

#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_wrappers.h"
#include "../infrastructure/mocks/mock_call_stack.h"

#include <memory>
#include <vector>

namespace
{
struct TreeNodeBase : public Object
{
    TreeNodeBase(char n, TreeNodeBase* l = nullptr, TreeNodeBase* r = nullptr)
        : Object{},
        name{n},
        left{l},
        right{r}
    {}

    std::vector<Object*> getChildren() const override
    {
        std::vector<Object*> result;
        if (left)
        {
            result.push_back(left);
        }

        if (right)
        {
            result.push_back(right);
        }

        return result;
    }

    char name;
    TreeNodeBase* left = nullptr;
    TreeNodeBase* right = nullptr;
};
using TreeNode = test::GloballyAllocatedObjectWrapper<TreeNodeBase>;

class TreeNodeGCTestFixture : public test::GlobalTestAllocatorFixture
{
public:
    void SetUp() override
    {
        DefaultGC::Callbacks gcCallbacks;
        gcCallbacks.beforeDeleted = [this](const Object& o)
        {
            auto it = std::find(_actualAliveObjects.begin(), _actualAliveObjects.end(), &o);
            ASSERT_NE(_actualAliveObjects.end(), it);
            _actualAliveObjects.erase(it);
        };

        _gc = std::make_unique<DefaultGC>(_callStack, std::move(gcCallbacks));

        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this] (void* o)
        {
            auto* obj = static_cast<Object*>(o);
            _gc->addObject(obj);
            _actualAliveObjects.push_back(obj);
        };
        _allocator = std::make_unique<TestAllocator>(std::move(allocatorCallbacks));
    }

    void TearDown() override
    {
        _allocator = nullptr;
        _gc = nullptr;
        _actualAliveObjects.clear();
    }

    const std::vector<const Object*>& getActualAliveObjects() const
    {
        return _actualAliveObjects;
    }

    const DefaultGC& getGC() const
    {
        return *_gc;
    }

    DefaultGC& getGC()
    {
        return *_gc;
    }

    test::MockCallStack& getCallStack()
    {
        return _callStack;
    }

    void initByLocalFrame(const CallStackFrame& currentFrame, 
                   const CallStackFrame& parentFrame,
                   std::size_t stackSize)
    {
        using namespace ::testing;
        ON_CALL(getCallStack(), getCurrentFrame()).WillByDefault(ReturnRef(currentFrame));
        ON_CALL(getCallStack(), getParentFrame()).WillByDefault(ReturnRef(parentFrame));
        ON_CALL(getCallStack(), size()).WillByDefault(Return(stackSize));
        ON_CALL(getCallStack(), empty()).WillByDefault(Return(stackSize == 0));
    }

    void initByGlobalFrame(const CallStackFrame& frame)
    {
        using namespace ::testing;
        ON_CALL(getCallStack(), getCurrentFrame()).WillByDefault(ReturnRef(frame));
        ON_CALL(getCallStack(), getParentFrame()).WillByDefault(Throw(std::runtime_error("No parent frame for global")));
        ON_CALL(getCallStack(), size()).WillByDefault(Return(1));
        ON_CALL(getCallStack(), empty()).WillByDefault(Return(false));
    }

    void initByNoFrame()
    {
        using namespace ::testing;
        static const auto e = std::runtime_error("No parent frame for global");
        ON_CALL(getCallStack(), getCurrentFrame()).WillByDefault(Throw(e));
        ON_CALL(getCallStack(), getFrameAtPosition(_)).WillByDefault(Throw(e));
        ON_CALL(getCallStack(), getParentFrame()).WillByDefault(Throw(e));
        ON_CALL(getCallStack(), size()).WillByDefault(Return(0u));
        ON_CALL(getCallStack(), empty()).WillByDefault(Return(true));
    }

private:
    std::vector<const Object*> _actualAliveObjects;
    std::unique_ptr<DefaultGC> _gc;

    ::testing::NiceMock<test::MockCallStack> _callStack;
};

TEST_F(TreeNodeGCTestFixture, simpleLocalAllocation)
{
    const CallStackFrame blockFrame{1u};
    const CallStackFrame globalFrame{0u};

    auto& gc = getGC();

    initByNoFrame();

    gc.onScopeOpened(globalFrame.scopeHandle);
    initByGlobalFrame(globalFrame);
    {
        gc.onScopeOpened(blockFrame.scopeHandle);
        initByLocalFrame(blockFrame, globalFrame, 2u);

        auto A = new TreeNode('A');

        const auto actual = getActualAliveObjects();
        const std::vector<const Object*> expectedAliveObjects{A};
        EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));

        gc.beforeScopeClosed(blockFrame.scopeHandle);
    }
    initByGlobalFrame(globalFrame);

    EXPECT_EQ(1u, gc.getAliveObjectsCount());

    gc.collect();

    EXPECT_EQ(0u, gc.getAliveObjectsCount());

    gc.beforeScopeClosed(globalFrame.scopeHandle);
    initByNoFrame();

    EXPECT_EQ(0u, gc.getAliveObjectsCount());
}

TEST_F(TreeNodeGCTestFixture, localAllocationInGlobalScope)
{
    const CallStackFrame globalFrame{0u};
    // No parent scope, current one is global
    
    auto& gc = getGC();

    EXPECT_EQ(0u, gc.getAliveObjectsCount());
    initByNoFrame();

    gc.onScopeOpened(globalFrame.scopeHandle);
    initByGlobalFrame(globalFrame);

    auto A = new TreeNode('A');

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));

    gc.beforeScopeClosed(globalFrame.scopeHandle);
    initByNoFrame();

    EXPECT_EQ(1u, gc.getAliveObjectsCount());

    gc.collect();

    EXPECT_EQ(0u, gc.getAliveObjectsCount());
}

// Init:
// A -> B -> C
// Action:
// A X-> B -> C
// Result:
// A
TEST_F(TreeNodeGCTestFixture, migrateChildrenIntoParentScope)
{
    const CallStackFrame functionFrame{2u};
    const CallStackFrame parentFrame{1u};
    const CallStackFrame globalFrame{0u};

    auto& gc = getGC();

    std::vector<const Object*> expectedAliveObjects{};

    const auto garbageMaker = [&]
    (TreeNodeBase*& suspensionPoint)
    {
        gc.onScopeOpened(functionFrame.scopeHandle);
        initByLocalFrame(functionFrame, parentFrame, 3u);

        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};

        expectedAliveObjects.push_back(B);
        expectedAliveObjects.push_back(C);

        B->left = C;
        suspensionPoint = B;

        gc.beforeScopeClosed(functionFrame.scopeHandle);
    };

    initByNoFrame();

    gc.onScopeOpened(globalFrame.scopeHandle);
    initByGlobalFrame(globalFrame);
    {
        auto A = new TreeNode{'A'};
        expectedAliveObjects.push_back(A);
        
        {
            gc.onScopeOpened(parentFrame.scopeHandle);
            initByLocalFrame(parentFrame, globalFrame, 2u);

            garbageMaker(A->left);
            initByLocalFrame(parentFrame, globalFrame, 2u);

            {
                const auto actual = getActualAliveObjects();
                EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
            }

            gc.collect();

            {
                const auto actual = getActualAliveObjects();
                EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
            }

            A->left = nullptr; // Make garbage unreachible

            // Garbage is alive for now
            {
                const auto actual = getActualAliveObjects();
                EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
            }

            gc.beforeScopeClosed(parentFrame.scopeHandle);
        }
        initByGlobalFrame(globalFrame);

        // A, B, C will be alive because B and C were moved after their former parent A into global scope
        gc.collect();

        const auto actual = getActualAliveObjects();
        EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
    }
    // Closing global scope
    gc.beforeScopeClosed(globalFrame.scopeHandle);
    initByNoFrame();

    gc.collect();
    EXPECT_EQ(0u, gc.getAliveObjectsCount());
}
/*
TEST_F(TreeNodeGCTestFixture, allocationWithoutVariable)
{
    getGC().onScopeOpened(0);

    EXPECT_EQ(0u, getActualAliveObjects().size());

    new TreeNode('A')->name = 'B';

    EXPECT_EQ(1u, getActualAliveObjects().size());

    getGC().onScopeClosed(0);

    EXPECT_EQ(0u, getActualAliveObjects().size());
}

// Init:
// A -> B
// B -> A
// Action:
// A X-> B
// B -> A
// Result:
// A
TEST_F(TreeNodeGCTestFixture, simpleCycleBreak)
{
    getGC().onScopeOpened(0);

    const auto garbageMaker = [this]
    {
        getGC().onScopeOpened(1);
        auto A = new TreeNode{'A'};
        auto B = new TreeNode{'B'};

        A->left = B;
        B->left = A;

        getGC().onScopeClosed(1);
        return A;
    };

    auto* A = garbageMaker();

    A->left = nullptr; // Loose garbage

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));

    getGC().onScopeClosed(0);
}

/*
// Init:
// A -> B
// B -> A
// Action:
// No action
// Result:
// A, B
TEST_F(TreeNodeGCTestFixture, simpleCycleNoBreak)
{
    auto A = new TreeNode{'A'};
    auto B = new TreeNode{'B'};

    getGC().addRoot(A);
    getGC().addRoot(B);

    A->left = B;
    B->left = A;

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A, B};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> B
// C -> D
// Action:
// Loose C and D
// Result:
// A, B
TEST_F(TreeNodeGCTestFixture, twoOneRootIslandOneGarbageIsland)
{
    const auto garbageMaker = [this]
    {
        auto C = new TreeNode{'C'};
        auto D = new TreeNode{'D'};

        getGC().addRoot(C);
        getGC().addRoot(D);

        C->right = D;

        getGC().removeRoot(C);
        getGC().removeRoot(D);
    };

    auto A = new TreeNode{'A'};
    auto B = new TreeNode{'B'};
    getGC().addRoot(A);
    getGC().addRoot(B);
    
    A->left = B;
    garbageMaker();

    EXPECT_EQ(4u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A, B};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

class DeepGarbageMaker final
{
public:
    DeepGarbageMaker(DefaultGC& gc)
        : _gc{gc}
    {
        
    }

    void __attribute__((noinline)) make() const
    { 
        bar(); 
    }

private:
    void __attribute__((noinline)) bar() const
    { 
        baz(); 
    }

    void __attribute__((noinline)) baz() const
    { 
        abacaba(); 
    }

    void __attribute__((noinline)) abacaba() const
    {
        auto C = new TreeNode{'C'};
        auto D = new TreeNode{'D'};

        _gc.addRoot(C);
        _gc.addRoot(D);

        C->right = D;

        _gc.removeRoot(C);
        _gc.removeRoot(D);
    }

    DefaultGC& _gc;
};

// Init:
// C -> D
// Action:
// Loose C and D
// Result:
// {}
TEST_F(TreeNodeGCTestFixture, detectDeepGarbage)
{
    auto A = new TreeNode{'A'};
    auto B = new TreeNode{'B'};
    A->left = B;

    getGC().addRoot(A);
    getGC().addRoot(B);

    DeepGarbageMaker deepGarbageMaker{getGC()};
    deepGarbageMaker.make();

    EXPECT_EQ(4u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A, B};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> B -> C
// A -> C
// Action:
// B X-> C
// Result:
// {A, B, C}
TEST_F(TreeNodeGCTestFixture, twoEdgesOneDestroyed)
{
    const auto createNodes = [this]
    {
        auto A = new TreeNode{'A'};
        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};

        getGC().addRoot(A);
        getGC().addRoot(B);
        getGC().addRoot(C);

        A->left = B;
        B->left = C;
        A->right = C;

        // Do not remove A since it is a return value
        getGC().removeRoot(B);
        getGC().removeRoot(C);

        return A;
    };

    auto* A = createNodes();

    A->left->left = nullptr; // B X-> C

    EXPECT_EQ(3u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(3u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A, A->left, A->right};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> B -> C
// D -> E -> F
// Action:
// X A, X D
// Result:
// {}
TEST_F(TreeNodeGCTestFixture, twoIslandsBothGarbage)
{
    const auto createNodes = [this]
    {
        auto A = new TreeNode{'A'};
        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};

        getGC().addRoot(A);
        getGC().addRoot(B);
        getGC().addRoot(C);

        A->left = B;
        B->left = C;

        auto D = new TreeNode{'D'};
        auto E = new TreeNode{'E'};
        auto F = new TreeNode{'F'};

        getGC().addRoot(D);
        getGC().addRoot(E);
        getGC().addRoot(F);

        D->right = E;
        E->right = F;

        getGC().removeRoot(A);
        getGC().removeRoot(B);
        getGC().removeRoot(C);
        getGC().removeRoot(D);
        getGC().removeRoot(E);
        getGC().removeRoot(F);
    };

    createNodes();

    EXPECT_EQ(6u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(0u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> A
// Action:
// A X-> A
// Result:
// {A}
TEST_F(TreeNodeGCTestFixture, selfCycleDeleteEdgeNoGarbage)
{
    const auto createNodes = [this]
    {
        auto A = new TreeNode{'A'};
        getGC().addRoot(A);

        A->left = A;

        // Do not remove A since it is a return value
        return A;
    };
    
    auto A = createNodes();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    A->left = nullptr;

    getGC().collect();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> A
// Action:
// X A
// Result:
// {}
TEST_F(TreeNodeGCTestFixture, lostSelfCycleNode)
{
    const auto createNodes = [this]
    {
        auto A = new TreeNode{'A'};
        getGC().addRoot(A);

        A->left = A;

        getGC().removeRoot(A);
    };
    
    createNodes();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(0u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

// Init:
// A -> B -> C -> D
// D -> A
// Action:
// B X-> C
// Result:
// {A}
TEST_F(TreeNodeGCTestFixture, longCycleBreakEdgeInTheMiddle)
{
    TreeNode* AA = nullptr;
    TreeNode* BB = nullptr;

    const auto createNodes = [&AA, &BB, this]
    {
        auto A = new TreeNode{'A'};
        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};
        auto D = new TreeNode{'D'};

        getGC().addRoot(A);
        getGC().addRoot(B);
        getGC().addRoot(C);
        getGC().addRoot(D);
        
        A->left = B;
        B->left = C;
        C->left = D;
        D->left = A;

        AA = A;
        BB = B;

        getGC().removeRoot(A);
        getGC().removeRoot(B);
        getGC().removeRoot(C);
        getGC().removeRoot(D);
    };
    
    createNodes();

    getGC().addRoot(AA);
    getGC().addRoot(BB);

    EXPECT_EQ(4u, getGC().getAliveObjectsCount());

    AA->left->left = nullptr; // B X-> C

    getGC().collect();

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{AA, BB};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}
*/
}