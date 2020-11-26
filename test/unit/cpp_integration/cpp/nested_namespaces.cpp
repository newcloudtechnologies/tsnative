namespace N1 {
namespace N2 {

class Clazz {
public:
  Clazz();
};

void takesClazz(Clazz c) { (void)c; };

} // namespace N2
} // namespace N1

N1::N2::Clazz::Clazz() {}