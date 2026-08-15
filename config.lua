Config = {}

Config.Debug = false

Config.UpdateInterval = 500      
Config.VehicleUpdateInterval = 50
Config.LocationUpdateInterval = 100 
Config.VoiceUpdateInterval = 300 

-- Default Values (Fallback)
Config.DefaultNeeds = {
    hunger = 100,
    thirst = 100,
    stress = 0
}


Config.SetPlayerHealthRechargeMultiplier = 0.0 -- Amount of health player regenerates (0.0 = disabled)

-- Needs Damage Settings (Health loss when hunger or thirst is 0)
Config.NeedsDamage = {
    Interval = 5000, 
    HungerDamage = 1,
    ThirstDamage = 2,
}

Config.ShowIDs = {
    DefaultKey = 'I', 
    Range = 20.0,  
}

