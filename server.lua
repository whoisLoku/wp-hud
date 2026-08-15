local function UpdatePlayerDevMode(source)
    if not GetPlayerName(source) then return end
    
    local qbPlayer = exports.qbx_core:GetPlayer(source)
    if not qbPlayer then return end
    
    local success, result = pcall(function()
        return exports.qbx_core:IsOptin(source)
    end)
    
    local isOptedIn = success and result or false
    Player(source).state:set('isDevMode', isOptedIn, true)
end

CreateThread(function()
    while true do
        local players = GetPlayers()
        for i = 1, #players do
            UpdatePlayerDevMode(tonumber(players[i]))
            Wait(100)
        end
        Wait(10000) 
    end
end)

AddEventHandler('playerJoining', function()
    local src = source
    Wait(1000)
    UpdatePlayerDevMode(src)
end)

