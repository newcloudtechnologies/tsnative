; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env = type {}

define i32 @main() {
entry:
  br label %while.cond

while.cond:                                       ; preds = %while.body.latch, %entry
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %env*
  store %env zeroinitializer, %env* %1
  %2 = call i1 @foo(%env* %1)
  br i1 %2, label %while.body, label %while.exiting

while.body.latch:                                 ; preds = %while.body
  br label %while.cond

while.exiting:                                    ; preds = %while.cond
  br label %while.end

while.body:                                       ; preds = %while.cond
  %3 = call i8* @_ZN2GC8allocateEj(i32 1)
  %4 = bitcast i8* %3 to %env*
  store %env zeroinitializer, %env* %4
  %5 = call i1 @foo(%env* %4)
  br label %while.body.latch

while.end:                                        ; preds = %while.exiting
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define i1 @foo(%env* %__environment__) {
entry:
  ret i1 false
}
