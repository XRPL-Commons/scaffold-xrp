#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(not(target_arch = "wasm32"))]
extern crate std;

use xrpl_wasm_std::core::current_tx::contract_call::get_current_contract_call;
use xrpl_wasm_std::core::current_tx::traits::ContractCallFields;
use xrpl_wasm_std::core::data::codec::{get_data, set_data};
use xrpl_wasm_std::host::trace::trace;

const COUNTER_KEY: &str = "counter";
const SUCCESS: i32 = 0;
const ERROR: i32 = -1;

fn read_counter() -> u32 {
    let contract_call = get_current_contract_call();
    let contract_account = contract_call.get_contract_account().unwrap();

    match get_data::<u32>(&contract_account, COUNTER_KEY) {
        Some(value) => value,
        None => 0,
    }
}

fn write_counter(value: u32) -> i32 {
    let contract_call = get_current_contract_call();
    let contract_account = contract_call.get_contract_account().unwrap();

    match set_data::<u32>(&contract_account, COUNTER_KEY, value) {
        Ok(_) => SUCCESS,
        Err(e) => e,
    }
}

/// @xrpl-function get_count
/// Returns the current counter value from persistent storage
#[unsafe(no_mangle)]
pub extern "C" fn get_count() -> i32 {
    let value = read_counter();
    let _ = trace("Getting counter value");
    value as i32
}

/// @xrpl-function increment
/// Increments the counter by 1 and returns the new value
#[unsafe(no_mangle)]
pub extern "C" fn increment() -> i32 {
    let current = read_counter();
    let new_value = current + 1;

    let result = write_counter(new_value);
    if result != SUCCESS {
        let _ = trace("Failed to increment counter");
        return ERROR;
    }

    let _ = trace("Counter incremented");
    new_value as i32
}

/// @xrpl-function decrement
/// Decrements the counter by 1 and returns the new value
#[unsafe(no_mangle)]
pub extern "C" fn decrement() -> i32 {
    let current = read_counter();

    if current == 0 {
        let _ = trace("Counter already at 0");
        return 0;
    }

    let new_value = current - 1;
    let result = write_counter(new_value);
    if result != SUCCESS {
        let _ = trace("Failed to decrement counter");
        return ERROR;
    }

    let _ = trace("Counter decremented");
    new_value as i32
}

/// @xrpl-function set_count
/// Sets the counter to a specific value
#[unsafe(no_mangle)]
pub extern "C" fn set_count(value: u32) -> i32 {
    let result = write_counter(value);
    if result != SUCCESS {
        let _ = trace("Failed to set counter");
        return ERROR;
    }

    let _ = trace("Counter set");
    value as i32
}

/// @xrpl-function reset
/// Resets the counter to 0
#[unsafe(no_mangle)]
pub extern "C" fn reset() -> i32 {
    let result = write_counter(0);
    if result != SUCCESS {
        let _ = trace("Failed to reset counter");
        return ERROR;
    }

    let _ = trace("Counter reset to 0");
    0
}

/// @xrpl-function add
/// Adds a specific amount to the counter
#[unsafe(no_mangle)]
pub extern "C" fn add(amount: u32) -> i32 {
    let current = read_counter();
    let new_value = current + amount;

    let result = write_counter(new_value);
    if result != SUCCESS {
        let _ = trace("Failed to add to counter");
        return ERROR;
    }

    let _ = trace("Added to counter");
    new_value as i32
}

/// @xrpl-function subtract
/// Subtracts a specific amount from the counter
#[unsafe(no_mangle)]
pub extern "C" fn subtract(amount: u32) -> i32 {
    let current = read_counter();

    if amount > current {
        let _ = trace("Subtraction would go below 0, setting to 0");
        let result = write_counter(0);
        if result != SUCCESS {
            let _ = trace("Failed to set counter to 0");
            return ERROR;
        }
        return 0;
    }

    let new_value = current - amount;
    let result = write_counter(new_value);
    if result != SUCCESS {
        let _ = trace("Failed to subtract from counter");
        return ERROR;
    }

    let _ = trace("Subtracted from counter");
    new_value as i32
}