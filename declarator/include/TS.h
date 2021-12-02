/*
 * Copyright (c) New Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

#pragma once

#ifdef TS
#define TS_EXPORT __attribute__((annotate("TS_EXPORT")))
#define TS_METHOD __attribute__((annotate("TS_METHOD")))
#define TS_CLOSURE __attribute__((annotate("TS_CLOSURE")))
#define _JOIN(p1, p2) #p1 #p2
#define TS_SIGNATURE(sig) __attribute__((annotate(_JOIN(TS_SIGNATURE =, sig))))
#define TS_NAME(name) __attribute__((annotate(_JOIN(TS_NAME =, name))))
#define TS_RETURN_TYPE(type) __attribute__((annotate(_JOIN(TS_RETURN_TYPE =, type))))
#define TS_GETTER __attribute__((annotate("TS_GETTER")))
#define TS_SETTER __attribute__((annotate("TS_SETTER")))

#else
#define TS_EXPORT
#define TS_METHOD
#define TS_CLOSURE
#define TS_SIGNATURE(sig)
#define TS_NAME(name)
#define TS_RETURN_TYPE(type)
#define TS_GETTER
#define TS_SETTER
#endif
