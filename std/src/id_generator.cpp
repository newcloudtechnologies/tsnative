#include "std/id_generator.h"

ID IDGenerator::currentID = 0;

ID IDGenerator::createID()
{
    return ++currentID;
}