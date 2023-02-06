/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "std/private/default_gc.h"
#include "std/tsobject.h"

#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_wrappers.h"

#include <memory>
#include <vector>

namespace
{
struct TreeNodeBase : public Object
{
    TreeNodeBase(char n, TreeNodeBase* l = nullptr, TreeNodeBase* r = nullptr)
        : Object{}
        , name{n}
        , left{l}
        , right{r}
    {
    }

    std::vector<Object*> getChildObjects() const override
    {
        auto result = Object::getChildObjects();
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

        _gc = std::make_unique<DefaultGC>(std::move(gcCallbacks));

        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this](void* o)
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

private:
    std::vector<const Object*> _actualAliveObjects;
    std::unique_ptr<DefaultGC> _gc;
};

// Init:
// A -> B -> C
// Action:
// A X-> B -> C
// Result:
// A
TEST_F(TreeNodeGCTestFixture, simpleTreeLooseBranch)
{
    const auto garbageMaker = [this](TreeNodeBase*& suspensionPoint)
    {
        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};

        getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&C), nullptr);

        B->left = C;
        suspensionPoint = B;

        getGC().removeRoot(Object::asObjectPtrPtr(&B));
        getGC().removeRoot(Object::asObjectPtrPtr(&C));
    };

    auto A = new TreeNode{'A'};
    getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);

    garbageMaker(A->left);

    A->left = nullptr; // Loose garbage

    EXPECT_EQ(3u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{A};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
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
    const auto garbageMaker = [this]
    {
        // Memory leak is here. Will be fixed after
        // https://jira.ncloudtech.ru:8090/browse/TSN-231
        auto A = new TreeNode* {new TreeNode{'A'}};
        auto B = new TreeNode{'B'};

        getGC().addRoot(Object::asObjectPtrPtr(A), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);

        (*A)->left = B;
        B->left = *A;

        // Do not remove A since it is a return value
        getGC().removeRoot(Object::asObjectPtrPtr(&B));

        return A;
    };

    auto** A = garbageMaker();

    (*A)->left = nullptr; // Loose garbage

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{*A};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

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

    getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);
    getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);

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

        getGC().addRoot(Object::asObjectPtrPtr(&C), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&D), nullptr);

        C->right = D;

        getGC().removeRoot(Object::asObjectPtrPtr(&C));
        getGC().removeRoot(Object::asObjectPtrPtr(&D));
    };

    auto A = new TreeNode{'A'};
    auto B = new TreeNode{'B'};
    getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);
    getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);

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

        _gc.addRoot(Object::asObjectPtrPtr(&C), nullptr);
        _gc.addRoot(Object::asObjectPtrPtr(&D), nullptr);

        C->right = D;

        _gc.removeRoot(Object::asObjectPtrPtr(&C));
        _gc.removeRoot(Object::asObjectPtrPtr(&D));
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

    getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);
    getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);

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
        // Memory leak is here. Will be fixed after
        // https://jira.ncloudtech.ru:8090/browse/TSN-231
        auto A = new TreeNode* {new TreeNode{'A'}};
        auto B = new TreeNode{'B'};
        auto C = new TreeNode{'C'};

        getGC().addRoot(Object::asObjectPtrPtr(A), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&C), nullptr);

        (*A)->left = B;
        B->left = C;
        (*A)->right = C;

        // Do not remove A since it is a return value
        getGC().removeRoot(Object::asObjectPtrPtr(&B));
        getGC().removeRoot(Object::asObjectPtrPtr(&C));

        return A;
    };

    auto** A = createNodes();

    (*A)->left->left = nullptr; // B X-> C

    EXPECT_EQ(3u, getGC().getAliveObjectsCount());

    getGC().collect();

    EXPECT_EQ(3u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{*A, (*A)->left, (*A)->right};
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

        getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&C), nullptr);

        A->left = B;
        B->left = C;

        auto D = new TreeNode{'D'};
        auto E = new TreeNode{'E'};
        auto F = new TreeNode{'F'};

        getGC().addRoot(Object::asObjectPtrPtr(&D), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&E), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&F), nullptr);

        D->right = E;
        E->right = F;

        getGC().removeRoot(Object::asObjectPtrPtr(&A));
        getGC().removeRoot(Object::asObjectPtrPtr(&B));
        getGC().removeRoot(Object::asObjectPtrPtr(&C));
        getGC().removeRoot(Object::asObjectPtrPtr(&D));
        getGC().removeRoot(Object::asObjectPtrPtr(&E));
        getGC().removeRoot(Object::asObjectPtrPtr(&F));
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
        // Memory leak is here. Will be fixed after
        // https://jira.ncloudtech.ru:8090/browse/TSN-231
        auto A = new TreeNode* {new TreeNode{'A'}};
        getGC().addRoot(Object::asObjectPtrPtr(A), nullptr);

        (*A)->left = *A;

        // Do not remove A since it is a return value
        return A;
    };

    auto A = createNodes();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    (*A)->left = nullptr;

    getGC().collect();

    EXPECT_EQ(1u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{*A};
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
        getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);

        A->left = A;

        getGC().removeRoot(Object::asObjectPtrPtr(&A));
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

        getGC().addRoot(Object::asObjectPtrPtr(&A), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&B), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&C), nullptr);
        getGC().addRoot(Object::asObjectPtrPtr(&D), nullptr);

        A->left = B;
        B->left = C;
        C->left = D;
        D->left = A;

        AA = A;
        BB = B;

        getGC().removeRoot(Object::asObjectPtrPtr(&A));
        getGC().removeRoot(Object::asObjectPtrPtr(&B));
        getGC().removeRoot(Object::asObjectPtrPtr(&C));
        getGC().removeRoot(Object::asObjectPtrPtr(&D));
    };

    createNodes();

    getGC().addRoot(Object::asObjectPtrPtr(&AA), nullptr);
    getGC().addRoot(Object::asObjectPtrPtr(&BB), nullptr);

    EXPECT_EQ(4u, getGC().getAliveObjectsCount());

    AA->left->left = nullptr; // B X-> C

    getGC().collect();

    EXPECT_EQ(2u, getGC().getAliveObjectsCount());

    const auto actual = getActualAliveObjects();
    const std::vector<const Object*> expectedAliveObjects{AA, BB};
    EXPECT_THAT(actual, ::testing::UnorderedElementsAreArray(expectedAliveObjects));
}

} // namespace