local fov = 50.0
local targetFov = 50.0
local baseFov = 50.0
local isZooming = false
local smoothing = 0.15
local zoomCam = nil

print("^2[HUD]^7 zoom success.")

local function updateCamera()
    local ped = PlayerPedId()
    if not zoomCam or not DoesCamExist(zoomCam) then
        zoomCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
        SetCamActive(zoomCam, true)
        RenderScriptCams(true, true, 200, true, true)
    end
    
    local coords = GetGameplayCamCoord()
    local rot = GetGameplayCamRot(2)
    
    local offset = GetOffsetFromEntityGivenWorldCoords(ped, coords.x, coords.y, coords.z)
    
    AttachCamToEntity(zoomCam, ped, offset.x, offset.y, offset.z, true)
    SetCamRot(zoomCam, rot.x, rot.y, rot.z, 2)
    SetCamFov(zoomCam, fov)
end

local function stopCamera()
    if zoomCam and DoesCamExist(zoomCam) then
        RenderScriptCams(false, true, 200, true, true)
        SetCamActive(zoomCam, false)
        DestroyCam(zoomCam, true)
        zoomCam = nil
    end
end

CreateThread(function()
    while true do
        local sleep = 100
        local ped = cache.ped
        local isHolding = IsDisabledControlPressed(0, 348) or IsControlPressed(0, 348)
        
        if isHolding then
            sleep = 0
            if not isZooming then
                isZooming = true
                baseFov = GetGameplayCamFov()
                fov = baseFov
            end
            targetFov = 20.0
            DisableControlAction(0, 37, true) 
            
            if math.abs(fov - targetFov) > 0.1 then
                fov = fov + (targetFov - fov) * smoothing
            else
                fov = targetFov
            end
            
            updateCamera()
        else
            if isZooming then
                isZooming = false
                stopCamera()
            end
        end
        Wait(sleep)
    end
end)
