hud

### Features

`/hud` — Toggles the HUD on/off. For quick `F11` button.

`/hudsettings` — Toggles the HUD settings.

`/cinematic` — Activates cinematic mode.

`/seat` [1-2-3-4] — change seat.

`/door` — [1-2-3-4] open/close door.

`/win` — [1-2-3-4] open/close windows.

zoom `mouse3` button.

showids `I` button.

left signal `←` button.

right signal `→` button.

hazards lights `↑` button.

seatbelt ON / OFF notification.

Send notifications when hunger or thirst levels fall below a certain point.

Health loss when hunger or thirst is 0

To hide/enable the HUD on the character selection screen or another screen.

```bash
exports('ShowHUD', function()
    ToggleHUD(true)
    print("^2[ShowHUD] end.^7")
end)

exports('HideHUD', function()
    ToggleHUD(false)
    print("^2[HideHUD] end.^7")
end)

exports('SetHUD', function(state)
    ToggleHUD(state)
    print("^2[SetHUD] end.^7")
end)
```