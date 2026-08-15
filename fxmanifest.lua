fx_version 'cerulean'
game 'gta5'

author 'loku'
description 'hud'
version '1'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/assets/*',
    'stream/minimap.gfx',
    'stream/minimap.ytd',
    'stream/squaremap.ytd',
}

dependency 'qbx_core'
dependency 'ox_lib'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua'
}

client_scripts {
    'client.lua',
    'client/zoom.lua'
}
server_script 'server.lua'