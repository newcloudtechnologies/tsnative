declare module "cpp" {
    import { int8_t, int16_t, int32_t, int64_t, uint8_t, uint16_t, uint32_t, uint64_t } from "std/definitions/lib.std.numeric";

    export class Acceptor {
        constructor();

        sumInt8(lhs: int8_t, rhs: int8_t): int8_t;
        sumInt16(lhs: int16_t, rhs: int16_t): int16_t;
        sumInt32(lhs: int32_t, rhs: int32_t): int32_t;
        sumInt64(lhs: int64_t, rhs: int64_t): int64_t;

        sumUInt8(lhs: uint8_t, rhs: uint8_t): uint8_t;
        sumUInt16(lhs: uint16_t, rhs: uint16_t): uint16_t;
        sumUInt32(lhs: uint32_t, rhs: uint32_t): uint32_t;
        sumUInt64(lhs: uint64_t, rhs: uint64_t): uint64_t;
    }
}