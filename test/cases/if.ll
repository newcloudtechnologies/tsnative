; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env__i1___i1___i1_ = type { i1*, i1*, i1* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to i1*
  store i1 false, i1* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 1)
  %3 = bitcast i8* %2 to i1*
  store i1 true, i1* %3
  %4 = call i8* @_ZN2GC8allocateEj(i32 1)
  %5 = bitcast i8* %4 to i1*
  store i1 false, i1* %5
  %a = insertvalue %env__i1___i1___i1_ zeroinitializer, i1* %1, 0
  %b = insertvalue %env__i1___i1___i1_ %a, i1* %3, 1
  %c = insertvalue %env__i1___i1___i1_ %b, i1* %5, 2
  %6 = call i8* @_ZN2GC8allocateEj(i32 24)
  %7 = bitcast i8* %6 to %env__i1___i1___i1_*
  store %env__i1___i1___i1_ %c, %env__i1___i1___i1_* %7
  %8 = call i1 @foo(%env__i1___i1___i1_* %7, i1 false, i1 true, i1 false)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define i1 @foo(%env__i1___i1___i1_* %__environment__, i1 %a, i1 %b, i1 %c) {
entry:
  %0 = load %env__i1___i1___i1_, %env__i1___i1___i1_* %__environment__
  %1 = extractvalue %env__i1___i1___i1_ %0, 0
  %.load = load i1, i1* %1
  br i1 %.load, label %then, label %else

then:                                             ; preds = %entry
  ret i1 false

else:                                             ; preds = %entry
  %2 = load %env__i1___i1___i1_, %env__i1___i1___i1_* %__environment__
  %3 = extractvalue %env__i1___i1___i1_ %2, 1
  %.load1 = load i1, i1* %3
  br i1 %.load1, label %then2, label %else3

endif:                                            ; preds = %endif4
  %4 = load %env__i1___i1___i1_, %env__i1___i1___i1_* %__environment__
  %5 = extractvalue %env__i1___i1___i1_ %4, 2
  %.load10 = load i1, i1* %5
  ret i1 %.load10

then2:                                            ; preds = %else
  %6 = load %env__i1___i1___i1_, %env__i1___i1___i1_* %__environment__
  %7 = extractvalue %env__i1___i1___i1_ %6, 2
  %.load5 = load i1, i1* %7
  br i1 %.load5, label %then6, label %else7

else3:                                            ; preds = %else
  br label %endif4

endif4:                                           ; preds = %else3, %endif8
  br label %endif

then6:                                            ; preds = %then2
  ret i1 true

else7:                                            ; preds = %then2
  %8 = load %env__i1___i1___i1_, %env__i1___i1___i1_* %__environment__
  %9 = extractvalue %env__i1___i1___i1_ %8, 1
  %.load9 = load i1, i1* %9
  ret i1 %.load9

endif8:                                           ; No predecessors!
  br label %endif4
}
