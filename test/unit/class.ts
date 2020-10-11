/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

{
  class B {
    cnt: number = 0;
    constructor(init: number) {
      this.cnt = init;
    }
    inc(): number {
      return ++this.cnt;
    }
  }

  let b = new B(3);

  console.assert(b.cnt === 3, "class: constructor(3) failed");
  console.assert(b.inc() === 4, "class: b.inc() failed");
}

{
  class Counter {
    value: number = 0;
    constructor(init: number) {
      this.value = init;
    }

    increment(): number {
      return ++this.value;
    }
  }

  class Runner {
    begin: Counter;
    end: Counter;
    current: Counter;

    constructor(min: number, max: number) {
      this.begin = new Counter(min);
      this.end = new Counter(max);
      this.current = new Counter(min);
    }

    tick() {
      if (this.current.value < this.end.value && this.current.value >= this.begin.value) {
        this.current.increment();
      }
    }

    count(): number {
      return this.current.value;
    }
  }

  const runner = new Runner(0, 9);
  console.assert(runner.count() === 0, "class: init failed");
  
  runner.tick();
  console.assert(runner.count() === 1, "class: tick1 failed");

  for (let i: number = 0; i < 100; i++) {
    runner.tick();
  }

  console.assert(runner.count() === 9, "class: tick3 failed");
}

{
  class Widget {
    private name: string;

    constructor() {
      this.name = "";
    }

    static make(): Widget {
      return new Widget();
    }

    setName(name: string) {
      this.name = name;
    }

    getName(): string {
      return this.name;
    }
  }

  let widget1 = Widget.make();
  widget1.setName("Widget1");

  let widget2 = Widget.make();
  widget2.setName("Widget2");

  console.assert(widget1.getName() === "Widget1", "class: widget1.getName() === 'Widget1' failed");
  console.assert(widget2.getName() === "Widget2", "class: widget2.getName() === 'Widget1' failed");
}

// @todo:
/*
{
  class Widget {
    private static COUNT: number = 0;   <== static fields are not implemented
    private name: string = "";          <== have to be initialized in constructor even it is empty

    constructor() { }

    static make(): Widget {
      return new Widget();
    }

    static get widgetCount(): number {
      return Widget.COUNT;
    }

    setName(name: string) {
      this.name = name;
    }

    getName(): string {
      return this.name;
    }
  }

   let widget1 = Widget.make();
   widget1.setName("Widget1");

   let widget2 = Widget.make();
   widget2.setName("Widget2");

   console.assert(Widget.widgetCount === 2, "class: Widget.widgetCount failed");
   console.assert(widget1.getName() === "Widget1", "class: widget1.getName() === 'Widget1' failed");
   console.assert(widget2.getName() === "Widget2", "class: widget2.getName() === 'Widget1' failed");
}
*/