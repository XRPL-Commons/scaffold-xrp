#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(not(target_arch = "wasm32"))]
extern crate std;

use xrpl_wasm_macros::wasm_export;
use xrpl_wasm_std::host::trace::trace;

/// @xrpl-function hello
#[wasm_export]
fn hello() -> i32 {
    let _ = trace("Hello from XRPL Smart Contract!");
    0
}
