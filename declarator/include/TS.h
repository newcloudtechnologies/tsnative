/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#ifdef TS
#define MK_ANNOTATION(ann, value) #ann "=" #value

#define CONCAT(a, b) _DO_CONCAT(a, b)
#define _DO_CONCAT(a, b) a##b

#define UNIQUE_NAME(base) CONCAT(base, __COUNTER__)

#define MK_TS_CODE(code) __attribute__((annotate(MK_ANNOTATION(TS_CODE, code))))

#define TS_MODULE(name) name __attribute__((annotate("TS_MODULE")))
#define TS_NAMESPACE(name) name __attribute__((annotate("TS_NAMESPACE")))
#define IS_TS_MODULE __attribute__((annotate("TS_MODULE")))
#define IS_TS_NAMESPACE __attribute__((annotate("TS_NAMESPACE;;TS_EXPORT")))
#define IS_TS_DECLARED_NAMESPACE __attribute__((annotate("TS_NAMESPACE;;TS_DECLARE")))
#define TS_EXPORT __attribute__((annotate("TS_EXPORT")))
#define TS_DECLARE __attribute__((annotate("TS_DECLARE")))
#define TS_NO_CHECK __attribute__((annotate("TS_NO_CHECK")))
#define TS_METHOD __attribute__((annotate("TS_METHOD")))
#define TS_CLOSURE __attribute__((annotate("TS_CLOSURE")))
#define TS_SIGNATURE(sig) __attribute__((annotate(MK_ANNOTATION(TS_SIGNATURE, sig))))
#define TS_DECORATOR(sig) __attribute__((annotate(MK_ANNOTATION(TS_DECORATOR, sig))))
#define TS_NAME(name) __attribute__((annotate(MK_ANNOTATION(TS_NAME, name))))
#define TS_RETURN_TYPE(type) __attribute__((annotate(MK_ANNOTATION(TS_RETURN_TYPE, type))))
#define TS_GETTER __attribute__((annotate("TS_GETTER")))
#define TS_SETTER __attribute__((annotate("TS_SETTER")))
#define TS_IGNORE __attribute__((annotate("TS_IGNORE")))
#define TS_CODE(code)                           \
    class MK_TS_CODE(code) UNIQUE_NAME(TS_CODE) \
    {                                           \
    };

// disable attributes:
#define __nomerge__

#else
#define TS_MODULE(name) name
#define TS_NAMESPACE(name) name
#define IS_TS_MODULE
#define IS_TS_NAMESPACE
#define IS_TS_DECLARED_NAMESPACE
#define TS_EXPORT
#define TS_DECLARE
#define TS_NO_CHECK
#define TS_METHOD
#define TS_CLOSURE
#define TS_SIGNATURE(sig)
#define TS_DECORATOR(sig)
#define TS_NAME(name)
#define TS_RETURN_TYPE(type)
#define TS_GETTER
#define TS_SETTER
#define TS_IGNORE
#define TS_CODE(code)
#endif
