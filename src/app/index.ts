/*---------------------------------------------------------------------------------------------
 *  Roku GamePad Gateway
 *
 *  Copyright (c) 2024 Marcelo Lv Cabral. All Rights Reserved.
 *
 *  Licensed under the MIT License. See LICENSE in the repository root for license information.
 *--------------------------------------------------------------------------------------------*/
import './css/main.css';
import './css/gamepad.css';
import gameControl, { GCGamepad, EventName } from "esm-gamecontroller.js";

const rokuIp = document.getElementById("rokuIp") as HTMLInputElement;
const gamePadName = document.getElementById("gamePadName") as HTMLInputElement;

const lastValidIp = localStorage.getItem("rokuIp");
rokuIp.value = lastValidIp ?? "";

// Game Pad Mapping
const axesMap = new Map([
    [0, ["up", "down", "left", "right"]],
    [1, ["up", "down", "left", "right"]],
]);
const buttonsMap = new Map([
    [0, "select"],
    [1, "back"],
    [2, "rev"],
    [3, "fwd"],
    [4, "info"],
    [5, "play"],
    [6, "instantreplay"],
    [7, "info"],
    [8, "home"],
    [9, "play"],
    [10, "a"],
    [11, "b"],
    [12, "up"],
    [13, "down"],
    [14, "left"],
    [15, "right"],
    [16, "instantreplay"],
    [17, "volumemute"],
]);

gameControl.on("connect", gamePadOnHandler);
gameControl.on("disconnect", gamePadOffHandler);

// GamePad handlers
function gamePadOnHandler(gamePad: GCGamepad) {
    console.info(`GamePad ${gamePad.id} connected!`, gamePad.buttons);
    axesMap.forEach((events, index) => {
        events.forEach((key: string) => {
            if (gamePad.axes > index) {
                const eventName = `${key}${index}` as EventName;
                gamePadSubscribe(gamePad, eventName, index, key);
            }
        });
    });
    buttonsMap.forEach((key, index) => {
        if (gamePad.buttons > index) {
            const eventName = `button${index}` as EventName;
            gamePadSubscribe(gamePad, eventName, index, key);
        }
    });
}

function gamePadSubscribe(gamePad: GCGamepad, eventName: EventName, index: number, key: string) {
    gamePad.before(eventName, () => {
        if (eventName.startsWith("button")) {
            key = buttonsMap.get(index) ?? "";
        }
        if (key !== "") {
            console.log(`GamePad ${gamePad.id} ${eventName} ${key} down!`);
            sendEcpKey(key, 0);
        }
    });
    gamePad.after(eventName, () => {
        if (eventName.startsWith("button")) {
            key = buttonsMap.get(index) ?? "";
        }
        if (key !== "") {
            console.log(`GamePad ${gamePad.id} ${eventName} ${key} up!`);
            sendEcpKey(key, 100);
        }
    });
}
function gamePadOffHandler(id: number) {
    console.info(`GamePad ${id} disconnected!`);
}

function sendEcpKey(key: string, mod: number = -1) {
    const host = rokuIp.value ?? "";
    if (!isValidIP(host)) {
        return;
    }
    if (host !== lastValidIp) {
        localStorage.setItem("rokuIp", host);
    }
    let command = "keypress";
    if (mod !== -1) {
        command = mod === 0 ? "keydown": "keyup";
    }
    const xhr = new XMLHttpRequest();
    const url = `http://${host}:8060/${command}/${key}`;
    try {
        xhr.open("POST", url, false);
        xhr.send();
    } catch (e: any) {
        // ignore;
    }
}

function isValidIP(ip: string) {
    if (ip && ip.length >= 7) {
        const ipFormat = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipFormat.test(ip);
    }
    return false;
}

window.addEventListener('gamepadconnected', ({ gamepad }) => {
    gamePadName.value = gamepad.id;
});
