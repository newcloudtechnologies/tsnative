#include "std/private/libuv_wrapper/timer_event_handler.h"

void uv::TimerEventHandler::startCallback(uv_timer_t* uv_timer_handle)
{
    TimerEventHandler& timer = *(static_cast<TimerEventHandler*>(uv_timer_handle->data));
    timer.emit(TimerEvent{});
}

int uv::TimerEventHandler::init()
{
    return ownerShipIf(uv_timer_init(parent().raw(), raw()));
}

int uv::TimerEventHandler::start(uv::TimerEventHandler::Time timeout, uv::TimerEventHandler::Time repeat)
{
    return uv_timer_start(raw(), &startCallback, timeout.count(), repeat.count());
}

int uv::TimerEventHandler::stop()
{
    return uv_timer_stop(raw());
}

void uv::TimerEventHandler::repeat(uv::TimerEventHandler::Time repeat)
{
    return uv_timer_set_repeat(raw(), repeat.count());
}

uv::TimerEventHandler::Time uv::TimerEventHandler::repeat()
{
    return Time{uv_timer_get_repeat(raw())};
}

uv::TimerEventHandler::Time uv::TimerEventHandler::dueIn()
{
    return Time{uv_timer_get_due_in(raw())};
}

int uv::TimerEventHandler::again()
{
    return uv_timer_again(raw());
}
