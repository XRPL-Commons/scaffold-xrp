//! Counter smart contract for XRPL (XLS-101).
//! Reference: https://github.com/XRPLF/XRPL-Standards/discussions/271
//!
//! Demonstrates: state management (ContractData), typed parameters (STParameters),
//! lifecycle callbacks (init, user_delete, clawback), trace logging.

#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(not(target_arch = "wasm32"))]
extern crate std;

use xrpl_wasm_macros::wasm_export;
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

// -- XLS-101 lifecycle callbacks --

/// @xrpl-function init (XLS-101 lifecycle: ContractCreate)
/// Initializes the counter to 0 when the contract is first deployed.
#[wasm_export]
fn init() -> i32 {
    let result = write_counter(0);
    if result != SUCCESS {
        let _ = trace("Failed to initialize counter");
        return ERROR;
    }

    let _ = trace("Contract initialized: counter set to 0");
    SUCCESS
}

/// @xrpl-function user_delete (XLS-101 lifecycle: ContractUserDelete)
/// Called when a user removes their contract-specific data.
#[wasm_export]
fn user_delete() -> i32 {
    let _ = trace("User data deletion acknowledged");
    SUCCESS
}

/// @xrpl-function clawback (XLS-101 lifecycle: ContractClawback)
/// Called when a token issuer claws back funds from this contract.
#[wasm_export]
fn clawback() -> i32 {
    let _ = trace("Token clawback acknowledged");
    SUCCESS
}

// -- User-callable functions --

/// @xrpl-function get_count (XLS-101 ContractCall)
/// @return INT32 - Current counter value
#[wasm_export]
fn get_count() -> i32 {
    let value = read_counter();
    let _ = trace("Getting counter value");
    value as i32
}

/// @xrpl-function increment (XLS-101 ContractCall)
/// @return INT32 - New counter value
#[wasm_export]
fn increment() -> i32 {
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

/// @xrpl-function decrement (XLS-101 ContractCall)
/// @return INT32 - New counter value
#[wasm_export]
fn decrement() -> i32 {
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

/// @xrpl-function set_count (XLS-101 ContractCall)
/// @param value UINT32 - The value to set the counter to
/// @return INT32 - The new counter value
#[wasm_export]
fn set_count(value: u32) -> i32 {
    let result = write_counter(value);
    if result != SUCCESS {
        let _ = trace("Failed to set counter");
        return ERROR;
    }

    let _ = trace("Counter set");
    value as i32
}

/// @xrpl-function reset (XLS-101 ContractCall)
/// @return INT32 - Zero
#[wasm_export]
fn reset() -> i32 {
    let result = write_counter(0);
    if result != SUCCESS {
        let _ = trace("Failed to reset counter");
        return ERROR;
    }

    let _ = trace("Counter reset to 0");
    0
}

/// @xrpl-function add (XLS-101 ContractCall)
/// @param amount UINT32 - The amount to add
/// @return INT32 - New counter value
#[wasm_export]
fn add(amount: u32) -> i32 {
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

/// @xrpl-function subtract (XLS-101 ContractCall)
/// @param amount UINT32 - The amount to subtract
/// @return INT32 - New counter value
#[wasm_export]
fn subtract(amount: u32) -> i32 {
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
