
#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Module.h"
#include "llvm/Support/TargetSelect.h"
#include "llvm/Support/raw_ostream.h"
#include "llvm/Transforms/Utils/BasicBlockUtils.h"
#include <nan.h>

#include "../node_modules/llvm-node/src/ir/alloca-inst.h"
#include "../node_modules/llvm-node/src/ir/basic-block.h"
#include "../node_modules/llvm-node/src/ir/call-inst.h"
#include "../node_modules/llvm-node/src/ir/function-type.h"
#include "../node_modules/llvm-node/src/ir/function.h"
#include "../node_modules/llvm-node/src/ir/global-variable.h"
#include "../node_modules/llvm-node/src/ir/ir-builder.h"
#include "../node_modules/llvm-node/src/ir/module.h"
#include "../node_modules/llvm-node/src/ir/value.h"

using namespace llvm;

class Generator {
public:
    Generator(Module *M, IRBuilder<> *builder) : mModule(M), mBuilder(builder) {
        mInt8Ty = Type::getInt8Ty(M->getContext());
        mInt32Ty = Type::getInt32Ty(M->getContext());
        mInt8PtrTy = PointerType::get(mInt8Ty, 0);
    }

    Module *module() const {
        return mModule;
    }

    IRBuilder<> *builder() const {
        return mBuilder;
    }

    Type *int32Ty() const {
        return mInt32Ty;
    }

    PointerType *int8PtrTy() const {
        return mInt8PtrTy;
    }

private:
    Module *mModule{nullptr};
    IRBuilder<> *mBuilder{nullptr};
    Type *mInt8Ty{nullptr};
    Type *mInt32Ty{nullptr};
    PointerType *mInt8PtrTy{nullptr};
};

class ExceptionHandlingGenerator : public Nan::ObjectWrap {
public:
    static NAN_MODULE_INIT(Init) {

        v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
        tpl->SetClassName(Nan::New("ExceptionHandlingGenerator").ToLocalChecked());
        tpl->InstanceTemplate()->SetInternalFieldCount(1);

        Nan::SetPrototypeMethod(tpl, "createUnreachable", ExceptionHandlingGenerator::createUnreachable);
        Nan::SetPrototypeMethod(tpl, "createInvoke", ExceptionHandlingGenerator::createInvoke);
        Nan::SetPrototypeMethod(tpl, "setPersonalityFn", ExceptionHandlingGenerator::setPersonalityFn);
        Nan::SetPrototypeMethod(tpl, "addLandingPad", ExceptionHandlingGenerator::addLandingPad);

        constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
        Nan::Set(target, Nan::New("ExceptionHandlingGenerator").ToLocalChecked(),
                 Nan::GetFunction(tpl).ToLocalChecked());
    }

private:
    explicit ExceptionHandlingGenerator(llvm::Module *module, llvm::IRBuilder<> *builder) : mGenerator{
                                                                                                    new Generator{module, builder}} {
    }

    ~ExceptionHandlingGenerator() override = default;

    static NAN_METHOD(New) {
        v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
        if (!info.IsConstructCall()) {
            return Nan::ThrowError(
                    Nan::New("ExceptionHandlingGenerator::New - called without 'new' keyword").ToLocalChecked());
        }
        ModuleWrapper *moduleWrapper = Nan::ObjectWrap::Unwrap<ModuleWrapper>(
                info[0]->ToObject(context).ToLocalChecked());

        IRBuilderWrapper *builderWrapper = Nan::ObjectWrap::Unwrap<IRBuilderWrapper>(
                info[1]->ToObject(context).ToLocalChecked());

        auto *obj = new ExceptionHandlingGenerator{moduleWrapper->getModule(), &builderWrapper->getIRBuilder()};
        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    }

    static NAN_METHOD(createUnreachable) {
        v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
        ExceptionHandlingGenerator *self = ObjectWrap::Unwrap<ExceptionHandlingGenerator>(info.Holder());
        self->mGenerator->builder()->CreateUnreachable();
    }

    static NAN_METHOD(createInvoke) {
        v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
        ExceptionHandlingGenerator *self = ObjectWrap::Unwrap<ExceptionHandlingGenerator>(info.Holder());

        ValueWrapper *valueWrapper = Nan::ObjectWrap::Unwrap<ValueWrapper>(info[0]->ToObject(context).ToLocalChecked());
        BasicBlockWrapper *normalDestWarapper = Nan::ObjectWrap::Unwrap<BasicBlockWrapper>(
                info[1]->ToObject(context).ToLocalChecked());
        BasicBlockWrapper *unwindDestWarapper = Nan::ObjectWrap::Unwrap<BasicBlockWrapper>(
                info[2]->ToObject(context).ToLocalChecked());

        v8::Local<v8::Array> tsArgs = v8::Local<v8::Array>::Cast(info[3]);
        std::vector<Value *> argValues(tsArgs->Length());
        for (size_t i = 0; i < tsArgs->Length(); ++i) {
            v8::Local<v8::Value> tsElement = tsArgs->Get(info.GetIsolate()->GetCurrentContext(), i).ToLocalChecked();
            argValues[i] = ValueWrapper::FromValue(tsElement)->getValue();
        }
        ArrayRef<Value *> refs{argValues.data(), argValues.size()};
        auto function = dyn_cast<Function>(valueWrapper->getValue());
        self->mGenerator->builder()->CreateInvoke(function, normalDestWarapper->getBasicBlock(),
                                                  unwindDestWarapper->getBasicBlock(), refs);
    }

    static NAN_METHOD(setPersonalityFn) {
        v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
        ExceptionHandlingGenerator *self = ObjectWrap::Unwrap<ExceptionHandlingGenerator>(info.Holder());
        FunctionWrapper *functionWrapperDestFn = Nan::ObjectWrap::Unwrap<FunctionWrapper>(
                info[0]->ToObject(context).ToLocalChecked());
        auto destFn = functionWrapperDestFn->getFunction();

        auto *persFnTy = FunctionType::get(self->mGenerator->int32Ty(), None, true);
        auto persFn = self->mGenerator->module()->getOrInsertFunction("__gxx_personality_v0", persFnTy);

        auto *bc = self->mGenerator->builder()->CreateBitCast(dyn_cast<Constant>(persFn.getCallee()), self->mGenerator->int8PtrTy());
        destFn->setPersonalityFn(dyn_cast<Constant>(dyn_cast<Constant>(bc)));
    }

    static NAN_METHOD(addLandingPad) {
        v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
        ExceptionHandlingGenerator *self = ObjectWrap::Unwrap<ExceptionHandlingGenerator>(info.Holder());

        // Get temporary alloca instruction. Temporary solution, because can't obtain invocation result to ts environment
        AllocaInstWrapper *allocaInstWrapper = Nan::ObjectWrap::Unwrap<AllocaInstWrapper>(info[0]->ToObject(context).ToLocalChecked());

        auto *generator = self->mGenerator;
        auto *builder = generator->builder();
        LandingPadInst *exceptionInst = builder->CreateLandingPad(
                StructType::get(self->mGenerator->int8PtrTy(), generator->int32Ty()), 1, "exception");

        // Get typeinfo associate C++ Runtime ("_ZTIPv" --> void*) See C++ ABI
        // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#rtti-layout and
        // https://opensource.apple.com/source/libcppabi/libcppabi-26/exports/libcppabi-.exp.auto.html
        GlobalVariable *typeInfo = generator->module()->getGlobalVariable("_ZTIPv");

        // Need move instruction after start exception instruction, because ir verified is failed
        exceptionInst->moveBefore(allocaInstWrapper->getAllocaInst());
        exceptionInst->addClause(ConstantExpr::getBitCast(typeInfo, builder->getInt8PtrTy()));
        exceptionInst->setCleanup(false);// avoid double free with GC

        // Get exception Ptr store in exception slot
        Value *excPtr = builder->CreateExtractValue(exceptionInst, {0}, "exc.ptr");
        auto *cxaBeginCatchTy = FunctionType::get(generator->int8PtrTy(), {generator->int8PtrTy()}, false);
        auto cxaBeginCatchCallee = generator->module()->getOrInsertFunction("__cxa_begin_catch", cxaBeginCatchTy);
        CallInst *beginCallInst = builder->CreateCall(cxaBeginCatchCallee, {excPtr});

        // Need store extracted allocated exception and store in alloca as output value
        builder->CreateStore(beginCallInst, allocaInstWrapper->getAllocaInst());
    }

    static inline Nan::Persistent<v8::Function> &constructor() {
        static Nan::Persistent<v8::Function> my_constructor;
        return my_constructor;
    }

private:
    Generator *mGenerator;
};

NODE_MODULE(ExceptionHandlingGenerator, ExceptionHandlingGenerator::Init);
