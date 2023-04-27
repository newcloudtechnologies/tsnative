// {
class Foo {
  static error: string = "throws from method";

  echo() {
    Foo.error;
  }
}

const foo = new Foo();
// //   console.assert(foo.echo("") === Foo.error);
// }
