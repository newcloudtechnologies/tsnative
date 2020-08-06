; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__()" = type {}

define i32 @main() {
entry:
  br label %while.cond

while.cond:                                       ; preds = %while.body.latch, %entry
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %1
  %2 = call i1* @foo(%"env__()"* %1)
  %3 = load i1, i1* %2
  br i1 %3, label %while.body, label %while.exiting

while.body.latch:                                 ; preds = %while.body
  br label %while.cond

while.exiting:                                    ; preds = %while.cond
  br label %while.end

while.body:                                       ; preds = %while.cond
  %4 = call i8* @_ZN2GC8allocateEj(i32 1)
  %5 = bitcast i8* %4 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %5
  %6 = call i1* @foo(%"env__()"* %5)
  br label %while.body.latch

while.end:                                        ; preds = %while.exiting
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define i1* @foo(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 1)
  %2 = bitcast i8* %1 to i1*
  store i1 false, i1* %2
  ret i1* %2
}
