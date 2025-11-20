#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(target_arch = "wasm32")]
use core::panic::PanicInfo;

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

static mut COUNTER: u32 = 0;

#[no_mangle]
pub extern "C" fn increment() -> u32 {
    unsafe {
        COUNTER += 1;
        COUNTER
    }
}

#[no_mangle]
pub extern "C" fn decrement() -> u32 {
    unsafe {
        if COUNTER > 0 {
            COUNTER -= 1;
        }
        COUNTER
    }
}

#[no_mangle]
pub extern "C" fn get_value() -> u32 {
    unsafe { COUNTER }
}

#[no_mangle]
pub extern "C" fn reset() -> u32 {
    unsafe {
        COUNTER = 0;
        COUNTER
    }
}

#[no_mangle]
pub extern "C" fn set_value(value: u32) -> u32 {
    unsafe {
        COUNTER = value;
        COUNTER
    }
}
