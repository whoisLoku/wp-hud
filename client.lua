local display = true
local cinematic = false
local hunger, thirst, stress = 100, 100, 0
local voiceData = { talking = false, range = 2 }
local speedometerFps = 45
local compassFps = 20
local customFuelOverride = nil
local lastFuelThresholdAlerted = 100


RegisterNetEvent('hud:client:ToggleCinematic', function(state)
    cinematic = state
    SendNUIMessage({ action = 'toggleCinematic', value = cinematic })
    if cinematic then DisplayRadar(false) end
end)

RegisterNetEvent('hud:client:OnMoneyChange', function(moneyType, amount, isRemove, reason)
    if moneyType ~= 'cash' then return end
    SendNUIMessage({
        action = 'showMoneyPayout',
        amount = amount,
        isRemove = isRemove,
        moneyType = moneyType
    })
end)

RegisterNetEvent('hud:client:UpdateNeeds', function(newHunger, newThirst)
    hunger = math.min(100, math.max(0, newHunger))
    thirst = math.min(100, math.max(0, newThirst))
end)

AddEventHandler('qbx_core:client:playerLoaded', function(PlayerData)
    if PlayerData.metadata then
        hunger = PlayerData.metadata.hunger or 100
        thirst = PlayerData.metadata.thirst or 100
        stress = PlayerData.metadata.stress or 0
    end
end)

RegisterNetEvent('qbx_core:client:setMetaData', function(metadata)
    if metadata.hunger then hunger = metadata.hunger end
    if metadata.thirst then thirst = metadata.thirst end
    if metadata.stress then stress = metadata.stress end
end)

RegisterNetEvent('hud:client:ToggleBusy', function(state)
    display = not state
    SendNUIMessage({ action = 'toggleHud', visible = display })
end)

RegisterNetEvent('hud:client:phoneStateChanged', function(isOpen, isNotification)
    SendNUIMessage({
        action = 'phoneStateChanged',
        payload = {
            isOpen = isOpen,
            isNotification = isNotification
        }
    })
end)

CreateThread(function()
    while true do
        if display then
            Wait(500)
            
            local ped = cache.ped
            local player = cache.playerId
            
            local health = tonumber(math.floor(math.max(0, math.min(100, GetEntityHealth(ped) - 100)))) or 0
            local armor = tonumber(math.floor(GetPedArmour(ped))) or 0
            local stamina = tonumber(100 - math.floor(GetPlayerSprintStaminaRemaining(player))) or 100
            local oxygen = tonumber(math.floor(GetPlayerUnderwaterTimeRemaining(player) * 10)) or 100
            local stance = 100

            SendNUIMessage({
                action = "updatePlayer",
                payload = {
                    health = health,
                    armor = armor,
                    hunger = math.floor(hunger),
                    thirst = math.floor(thirst),
                    stress = math.floor(stress),
                    stamina = stamina,
                    oxygen = oxygen,
                    stance = stance,
                    isInVehicle = cache.vehicle and true or false
                }
            })
        else
            Wait(1000) 
        end
    end
end)


CreateThread(function()
    local lastVehicleState = false
    local seatbeltOn = false

    RegisterNetEvent('seatbelt:client:ToggleSeatbelt', function(state)
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local isBuckled = state
            if isBuckled == nil then
                isBuckled = (LocalPlayer.state.seatbelt or LocalPlayer.state.harness) or false
            end
            if seatbeltOn ~= isBuckled then
                seatbeltOn = isBuckled
                lib.notify({
                    id = 'seatbelt_notify',
                    dismiss = true
                })
                Wait(50)
                if seatbeltOn then
                    lib.notify({
                        id = 'seatbelt_notify',
                        title = '',
                        description = 'Seatbelt ON',
                        type = 'warning',
                        position = 'top-right'
                    })
                else
                    lib.notify({
                        id = 'seatbelt_notify',
                        title = '',
                        description = 'Seatbelt OFF',
                        type = 'warning',
                        position = 'top-right'
                    })
                end
            end
        end
    end)
    
    while true do
        local vehicle = cache.vehicle
        if vehicle and DoesEntityExist(vehicle) and display then
            Wait(math.floor(1000 / speedometerFps))
            
            local vehicleClass = GetVehicleClass(vehicle)
            
            local speed = math.floor(GetEntitySpeed(vehicle) * 3.6)
            local rpm = GetIsVehicleEngineRunning(vehicle) and GetVehicleCurrentRpm(vehicle) or 0.0
            local gear = GetVehicleCurrentGear(vehicle)
            local displayGear = (gear == 0 and speed > 1) and "R" or gear
            local fuel = customFuelOverride or math.floor(GetVehicleFuelLevel(vehicle))
            local engine = math.floor(GetVehicleEngineHealth(vehicle) / 10)
            local locked = GetVehicleDoorLockStatus(vehicle) == 2
            
            if fuel <= 15 then
                local threshold = 0
                if fuel <= 5 then
                    threshold = 5
                elseif fuel <= 10 then
                    threshold = 10
                elseif fuel <= 15 then
                    threshold = 15
                end
                
                if threshold > 0 and lastFuelThresholdAlerted > threshold then
                    lastFuelThresholdAlerted = threshold
                    lib.notify({
                        title = 'Düşük Yakıt',
                        description = 'Aracın yakıtı azalıyor!',
                        type = 'warning'
                    })
                end
            else
                if lastFuelThresholdAlerted < 100 then
                    lastFuelThresholdAlerted = 100
                end
            end
            
            local pitch, roll, altitude, agl = 0.0, 0.0, 0.0, 0.0
            if vehicleClass == 15 or vehicleClass == 16 then
                local pos = GetEntityCoords(vehicle)
                altitude = math.floor(pos.z * 3.28084)
                agl = math.floor(GetEntityHeightAboveGround(vehicle) * 3.28084)
                local rotation = GetEntityRotation(vehicle, 2)
                pitch = rotation.x
                roll = -rotation.y
            end
            
            if not indicatorState then indicatorState = { left = false, right = false, hazards = false } end
            
            local lightsState, lightsOn, highbeams = GetVehicleLightsState(vehicle)
            local indicatorLights = GetVehicleIndicatorLights(vehicle)
            seatbeltOn = (LocalPlayer.state.seatbelt or LocalPlayer.state.harness) or false
            
            SendNUIMessage({
                action = "updateVehicle",
                payload = {
                    inVehicle = true,
                    speed = speed,
                    rpm = rpm,
                    gear = displayGear,
                    fuel = fuel,
                    engine = engine,
                    locked = locked,
                    altitude = altitude,
                    agl = agl,
                    pitch = pitch,
                    roll = roll,
                    vehicleClass = vehicleClass,
                    isElectric = vehicleClass == 13,
                    seatbelt = seatbeltOn,
                    indicators = {
                        leftTurn = (indicatorLights == 1 or indicatorLights == 3),
                        rightTurn = (indicatorLights == 2 or indicatorLights == 3),
                        hazards = (indicatorLights == 3),
                        lowBeam = (lightsOn == 1),
                        highBeam = (highbeams == 1),
                        handbrake = GetVehicleHandbrake(vehicle)
                    }
                }
            })
            
            DisplayRadar(not cinematic)
            if not lastVehicleState then lastVehicleState = true end
        else
            if lastVehicleState then
                lastVehicleState = false
                seatbeltOn = false
                customFuelOverride = nil
                lastFuelThresholdAlerted = 100
                DisplayRadar(false)
                SendNUIMessage({ action = "updateVehicle", payload = { inVehicle = false } })
            end
            Wait(1000)
        end
    end
end)

local headings = { "N", "NW", "W", "SW", "S", "SE", "E", "NE" }
CreateThread(function()
    while true do
        local vehicle = cache.vehicle
        
        if vehicle and display then
            Wait(math.floor(1000 / compassFps))
            local ped = cache.ped
            local pos = GetEntityCoords(ped)

            local camHeading = GetGameplayCamRot(0).z
            if camHeading < 0.0 then
                camHeading = camHeading + 360.0
            end
            local hIndex = math.floor(((camHeading + 22.5) % 360) / 45) + 1
            local dir = headings[hIndex] or "N"

            local streetHash, crossingHash = GetStreetNameAtCoord(pos.x, pos.y, pos.z)
            local street = GetStreetNameFromHashKey(streetHash)
            local crossing = GetStreetNameFromHashKey(crossingHash)
            if crossing and crossing ~= "" then
                street = street .. " x " .. crossing
            end
            
            local zone = GetNameOfZone(pos.x, pos.y, pos.z)
            local zoneLabel = GetLabelText(zone)

            local distance = -1
            local waypointAngle = nil
            if IsWaypointActive() then
                local wpBlip = GetFirstBlipInfoId(8)
                if DoesBlipExist(wpBlip) then
                    local wpCoords = GetBlipInfoIdCoord(wpBlip)
                    distance = math.floor(#(pos - wpCoords) * 0.000621371 * 10) / 10
                    
                    local dx = wpCoords.x - pos.x
                    local dy = wpCoords.y - pos.y
                    local bearing = math.deg(math.atan2(-dx, dy))
                    if bearing < 0 then
                        bearing = bearing + 360.0
                    end
                    waypointAngle = bearing
                end
            end

            SendNUIMessage({
                action = "updateLocation",
                payload = {
                    street = street,
                    zone = zoneLabel,
                    heading = dir,
                    headingAngle = camHeading,
                    waypointDistance = distance,
                    waypointAngle = waypointAngle
                }
            })
        else
            Wait(1500)
        end
    end
end)

local isCinematicActive = false
RegisterNUICallback('toggleCinematicRadar', function(data, cb)
    if data and type(data.state) == "boolean" then
        isCinematicActive = data.state
        cinematic = data.state
        DisplayRadar(display and not cinematic and IsPedInAnyVehicle(PlayerPedId(), false))
    end
    if cb then cb('ok') end
end)

local indicatorState = { left = false, right = false, hazards = false }

RegisterCommand('+indicator_left', function()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then return end
    local vehicle = GetVehiclePedIsIn(ped, false)
    if GetPedInVehicleSeat(vehicle, -1) ~= ped then return end

    indicatorState.left = not indicatorState.left
    indicatorState.right = false
    indicatorState.hazards = false
    SetVehicleIndicatorLights(vehicle, 1, indicatorState.left)
    SetVehicleIndicatorLights(vehicle, 0, false)
end, false)
RegisterKeyMapping('+indicator_left', 'Left Signal~', 'keyboard', 'LEFT')

RegisterCommand('+indicator_right', function()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then return end
    local vehicle = GetVehiclePedIsIn(ped, false)
    if GetPedInVehicleSeat(vehicle, -1) ~= ped then return end 

    indicatorState.right = not indicatorState.right
    indicatorState.left = false
    indicatorState.hazards = false
    SetVehicleIndicatorLights(vehicle, 0, indicatorState.right)
    SetVehicleIndicatorLights(vehicle, 1, false)
end, false)
RegisterKeyMapping('+indicator_right', 'Right Signal~', 'keyboard', 'RIGHT')

RegisterCommand('+indicator_hazards', function()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then return end
    local vehicle = GetVehiclePedIsIn(ped, false)
    if GetPedInVehicleSeat(vehicle, -1) ~= ped then return end 

    indicatorState.hazards = not indicatorState.hazards
    indicatorState.left = false
    indicatorState.right = false
    SetVehicleIndicatorLights(vehicle, 1, indicatorState.hazards) 
    SetVehicleIndicatorLights(vehicle, 0, indicatorState.hazards) 
end, false)
RegisterKeyMapping('+indicator_hazards', 'Hazard Lights~', 'keyboard', 'UP')



RegisterCommand('seat', function(source, args)
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        local seatIndex = tonumber(args[1])
        if seatIndex then
            local vehicle = GetVehiclePedIsIn(ped, false)
            local targetSeat = seatIndex - 2
            if seatIndex == 1 then targetSeat = -1 end
            
            if IsVehicleSeatFree(vehicle, targetSeat) then
                SetPedIntoVehicle(ped, vehicle, targetSeat)
            else
                lib.notify({
                    title = 'Seat Occupied',
                    description = 'This seat is already taken!',
                    type = 'error'
                })
            end
        end
    end
end)

RegisterCommand('door', function(source, args)
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        local doorIndex = tonumber(args[1])
        if doorIndex then
            local vehicle = GetVehiclePedIsIn(ped, false)

            local targetDoor = doorIndex - 1
            
            if GetVehicleDoorAngleRatio(vehicle, targetDoor) > 0 then
                SetVehicleDoorShut(vehicle, targetDoor, false)
            else
                SetVehicleDoorOpen(vehicle, targetDoor, false, false)
            end
        end
    end
end)

local windowStates = {}
RegisterCommand('win', function(source, args)
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        local windowIndex = tonumber(args[1])
        if windowIndex and windowIndex >= 1 and windowIndex <= 4 then
            local vehicle = GetVehiclePedIsIn(ped, false)
            local targetWindow = windowIndex - 1
            
            local netId = VehToNet(vehicle)
            if not windowStates[netId] then
                windowStates[netId] = {}
            end
            
            windowStates[netId][targetWindow] = not windowStates[netId][targetWindow]
            
            if windowStates[netId][targetWindow] then
                RollDownWindow(vehicle, targetWindow)
            else
                RollUpWindow(vehicle, targetWindow)
            end
        end
    end
end)

local voiceActive = false
CreateThread(function()
    while true do
        Wait(100)
        if display then
            local talking = NetworkIsPlayerTalking(PlayerId()) == 1 or NetworkIsPlayerTalking(PlayerId()) == true
            local pttPressed = IsControlPressed(0, 249) == 1 or IsControlPressed(0, 249) == true
            local active = pttPressed or (voiceData.isRadioTalking == true) or talking

            if talking ~= voiceData.talking or active ~= voiceActive then
                voiceData.talking = talking
                voiceActive = active
                SendNUIMessage({
                    action = 'updateVoice',
                    payload = {
                        talking = talking,
                        active = active,
                        range = voiceData.range,
                        isRadioTalking = voiceData.isRadioTalking or false
                    }
                })
            end
        end
    end
end)

AddEventHandler('pma-voice:setTalkingMode', function(mode)
    voiceData.range = mode
    SendNUIMessage({
        action = 'updateVoice',
        payload = {
            talking = voiceData.talking,
            active = voiceActive,
            range = mode,
            isRadioTalking = voiceData.isRadioTalking or false
        }
    })
end)

AddEventHandler('pma-voice:radioActive', function(radioTalking)
    voiceData.isRadioTalking = radioTalking
    local talking = NetworkIsPlayerTalking(PlayerId()) == 1 or NetworkIsPlayerTalking(PlayerId()) == true
    local pttPressed = IsControlPressed(0, 249) == 1 or IsControlPressed(0, 249) == true
    local active = pttPressed or radioTalking or talking
    voiceActive = active
    
    SendNUIMessage({
        action = 'updateVoice',
        payload = {
            talking = talking,
            active = active,
            range = voiceData.range,
            isRadioTalking = radioTalking
        }
    })
end)

RegisterCommand('hud', function()
    display = not display
    SendNUIMessage({ action = 'toggleHud', visible = display })
    DisplayRadar(display and IsPedInAnyVehicle(PlayerPedId(), false))
end, false)
RegisterKeyMapping('hud', 'HUD Visibility~', 'keyboard', 'F11')

local isDevMode = false

local function UpdateDevMode(status)
    if status ~= isDevMode then
        isDevMode = status
        SendNUIMessage({ action = 'setDevMode', value = isDevMode })
        print("^2[HUD]^7 dev mode: " .. (isDevMode and "enabled" or "disabled"))
    end
end

AddStateBagChangeHandler('isDevMode', 'player:' .. GetPlayerServerId(PlayerId()), function(_, _, value)
    UpdateDevMode(value or false)
end)

CreateThread(function()
    while true do
        Wait(5000)
        local status = LocalPlayer.state.isDevMode or false
        UpdateDevMode(status)
    end
end)

RegisterCommand('hudsettings', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'openHudSettings' })
end)

RegisterNUICallback('setNuiFocus', function(data, cb)
    SetNuiFocus(data.focus, data.cursor)
    cb('ok')
end)

RegisterNUICallback('saveSettings', function(data, cb)
    if data and data.hudSettings then
        speedometerFps = data.hudSettings.speedometerFps or 45
        compassFps = data.hudSettings.compassFps or 20
    end
    if cb then cb('ok') end
end)


local function ToggleHUD(state)
    display = state and true or false

    SendNUIMessage({
        action = 'toggleHud',
        visible = display
    })

    DisplayRadar(display and IsPedInAnyVehicle(PlayerPedId(), false))
    SetRadarBigmapEnabled(false, false)
    print("^2[ToggleHUD]^7")
end

AddEventHandler('onClientResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        print("^2[HUD]^7 hud success.")
    end
end)

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

RegisterCommand('cinematic', function()
    SendNUIMessage({ action = 'toggleCinematic' })
end)

CreateThread(function()
    while not NetworkIsPlayerActive(PlayerId()) do
        Wait(500)
    end
    Wait(2000) 
    local defaultAspectRatio = 1920 / 1080
    local resolutionX, resolutionY = GetActiveScreenResolution()
    local aspectRatio = resolutionX / resolutionY
    local minimapOffset = 0
    if aspectRatio > defaultAspectRatio then
        minimapOffset = ((defaultAspectRatio - aspectRatio) / 3.6) - 0.008
    end

    RequestStreamedTextureDict("squaremap", false)
    while not HasStreamedTextureDictLoaded("squaremap") do Wait(100) end

    AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "squaremap", "radarmasksm")
    AddReplaceTexture('platform:/textures/graphics', 'radarmask1g', 'squaremap', 'radarmasksm')

    SetMinimapClipType(0)

    SetRadarBigmapEnabled(true, false)
    Wait(200)
    SetRadarBigmapEnabled(false, false)

    -- 0.0 = nav symbol and icons left
    -- 0.1638 = nav symbol and icons stretched
    -- 0.216 = nav symbol and icons raised up
    -- X has been increased slightly (+0.003) to shift right
    -- Right stretch: 0.168 -> 0.173, Up stretch: 0.205 -> 0.220
    -- Restored values for standard square map
    SetMinimapComponentPosition('minimap', 'L', 'B', 0.0 + minimapOffset, -0.047, 0.1638, 0.183)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B', 0.0 + minimapOffset, 0.0, 0.178, 0.20)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.008 + minimapOffset, 0.015, 0.268, 0.314)
    SetBlipAlpha(GetNorthRadarBlip(), 0)
end)

CreateThread(function()
    -- settings renk şeyi (loku)
    ReplaceHudColourWithRgba(116, 194, 249, 89, 204)
    ReplaceHudColourWithRgba(114, 194, 249, 89, 204)
    
    while true do
        Wait(0)
        SetPlayerHealthRechargeMultiplier(PlayerId(), 0.0)
        
        HideHudComponentThisFrame(1)  
        HideHudComponentThisFrame(2) 
        HideHudComponentThisFrame(3) 
        HideHudComponentThisFrame(4)  
        HideHudComponentThisFrame(6) 
        HideHudComponentThisFrame(7)  
        HideHudComponentThisFrame(8)  
        HideHudComponentThisFrame(9) 
        HideHudComponentThisFrame(13) 
        HideHudComponentThisFrame(17) 
        HideHudComponentThisFrame(20) 
        HideHudComponentThisFrame(21) 
        HideHudComponentThisFrame(22) 
    end
end)

local function DebugPrint(msg)
    if Config.Debug then
        print("^3[HUD-DEBUG]^7 " .. tostring(msg))
    end
end

local hungerNotified = false
local thirstNotified = false

CreateThread(function()
    while true do
        Wait(Config.NeedsDamage.Interval)
        local ped = PlayerPedId()
        local playerState = LocalPlayer.state
        if not playerState.isDead and not IsEntityDead(ped) then
            local damage = 0
            if hunger <= 0 then
                damage = damage + Config.NeedsDamage.HungerDamage
                if not hungerNotified then
                    lib.notify({
                        title = 'Açlık',
                        description = 'Çok açım, bir şeyler yemeliyim!',
                        type = 'warning'
                    })
                    hungerNotified = true
                end
            else
                hungerNotified = false
            end

            if thirst <= 0 then
                damage = damage + Config.NeedsDamage.ThirstDamage
                if not thirstNotified then
                    lib.notify({
                        title = 'Susuzluk',
                        description = 'Çok susadım, bir şeyler içmeliyim!',
                        type = 'warning'
                    })
                    thirstNotified = true
                end
            else
                thirstNotified = false
            end
            
            if damage > 0 then
                local currentHealth = GetEntityHealth(ped)
                local newHealth = currentHealth - damage
                SetEntityHealth(ped, newHealth)
                DebugPrint("Hunger/Thirst 0: Player damaged by " .. damage .. " HP. Current health: " .. newHealth)
            end
        end
    end
end)

CreateThread(function()
    local lastWeapon = nil
    local lastClip = -1
    local lastAmmo = -1
    local lastVisible = false

    while true do
        local ped = PlayerPedId()
        local visible = false
        local clip = 0
        local ammo = 0
        local hasClip = false

        if display and not cinematic then
            local weaponHash = GetSelectedPedWeapon(ped)
            if weaponHash ~= 0 and weaponHash ~= GetHashKey("WEAPON_UNARMED") then
                local weaponGroup = GetWeapontypeGroup(weaponHash)
                if weaponGroup ~= GetHashKey("GROUP_MELEE") and weaponGroup ~= GetHashKey("GROUP_UNARMED") and weaponHash ~= GetHashKey("WEAPON_PARACHUTE") then
                    visible = true
                    local hasAmmoResult, currentClip = GetAmmoInClip(ped, weaponHash)
                    
                    local hasClipResult, maxClip = GetMaxAmmoInClip(ped, weaponHash, true)
                    hasClip = (hasClipResult and maxClip and maxClip > 0) or false
                    
                    if not hasClip then
                        local noClipGroups = {
                            [GetHashKey("GROUP_MELEE")] = true,
                            [GetHashKey("GROUP_UNARMED")] = true,
                            [GetHashKey("GROUP_THROWN")] = true,
                        }
                        local noClipWeapons = {
                            [GetHashKey("WEAPON_PETROLCAN")] = true,
                            [GetHashKey("WEAPON_FIREEXTINGUISHER")] = true,
                            [GetHashKey("WEAPON_HAZARDCAN")] = true,
                            [GetHashKey("WEAPON_FERTILIZERCAN")] = true,
                        }
                        if not noClipGroups[weaponGroup] and not noClipWeapons[weaponHash] then
                            hasClip = true
                        end
                    end
                    
                    clip = (hasAmmoResult and currentClip) or 0
                    
                    local curWeapon = exports.chr_inventory:getCurrentWeapon()
                    if curWeapon and curWeapon.ammo then
                        ammo = exports.chr_inventory:Search('count', curWeapon.ammo) or 0
                    else
                        local totalAmmo = GetAmmoInPedWeapon(ped, weaponHash) or 0
                        ammo = totalAmmo - clip
                    end
                    if ammo < 0 then ammo = 0 end
                end
            end
        end

        if visible ~= lastVisible or clip ~= lastClip or ammo ~= lastAmmo then
            lastVisible = visible
            lastClip = clip
            lastAmmo = ammo
            --print(string.format("[HUD-WEAPON] Update - visible: %s, clip: %d, ammo: %d, hasClip: %s", tostring(visible), clip, ammo, tostring(hasClip)))
            SendNUIMessage({
                action = "updateWeapon",
                payload = {
                    visible = visible,
                    clip = clip,
                    ammo = ammo,
                    hasClip = hasClip
                }
            })
        end

        if visible then
            Wait(100)
        else
            Wait(500) 
        end
    end
end)

Citizen.CreateThread(function()
    ReplaceHudColourWithRgba(
        142, 
        169, 
        201, 
        243, 
        255
    )
end)

local showIDs = false

local function DrawText3D(coords, text)
    local onScreen, _x, _y = World3dToScreen2d(coords.x, coords.y, coords.z)
    if onScreen then
        local camCoords = GetGameplayCamCoords()
        local dist = #(camCoords - coords)
        local scale = (1 / dist) * 2
        local fov = (1 / GetGameplayCamFov()) * 100
        scale = scale * fov
        if scale < 0.25 then scale = 0.25 end
        if scale > 0.8 then scale = 0.8 end

        SetTextScale(0.0, 0.60 * scale)
        SetTextFont(4)
        SetTextProportional(1)
        SetTextColour(255, 255, 255, 255)
        SetTextOutline()
        SetTextEntry("STRING")
        SetTextCentre(1)
        AddTextComponentString(text)
        DrawText(_x, _y)
    end
end

RegisterCommand('+showids', function()
    if showIDs then return end
    showIDs = true
    CreateThread(function()
        local maxRange = Config.ShowIDs and Config.ShowIDs.Range or 20.0
        while showIDs do
            local localPed = PlayerPedId()
            local localCoords = GetEntityCoords(localPed)
            
            local nearbyPlayers = lib.getNearbyPlayers(localCoords, maxRange, true)
            
            for i = 1, #nearbyPlayers do
                local data = nearbyPlayers[i]
                local ped = data.ped
                if DoesEntityExist(ped) then
                    local serverId = GetPlayerServerId(data.id)
                    local headCoords = GetPedBoneCoords(ped, 31086, 0.0, 0.0, 0.0)
                    local drawCoords = vector3(headCoords.x, headCoords.y, headCoords.z + 0.3)
                    DrawText3D(drawCoords, "state ID : " .. serverId)
                end
            end
            Wait(0)
        end
    end)
end, false)

RegisterCommand('-showids', function()
    showIDs = false
end, false)

local defaultKey = Config.ShowIDs and Config.ShowIDs.DefaultKey or 'I'
RegisterKeyMapping('+showids', 'Show Player IDs~', 'keyboard', defaultKey)

CreateThread(function()
    local isHudHiddenDueToPause = false
    while true do
        Wait(300)
        local isPaused = IsPauseMenuActive()
        if isPaused and not isHudHiddenDueToPause then
            isHudHiddenDueToPause = true
            SendNUIMessage({ action = "toggleHud", visible = false })
        elseif not isPaused and isHudHiddenDueToPause then
            isHudHiddenDueToPause = false
            SendNUIMessage({ action = "toggleHud", visible = display })
        end
    end
end)

