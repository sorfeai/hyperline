dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get string:org.mpris.MediaPlayer2.Player string:Metadata | tr -d '\n' | sed -E 's/.*xesam:title[^\)]*string\s+"([^\"]*)".*/\1/'
