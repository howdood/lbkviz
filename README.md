# lbkviz
how to run the website in local mode with no desktop

nb you also need nginx set up to serve the website on localhost - or you could just feed chromium the file path


Terminal commands to set up chromium kiosk on server:
`````
sudo apt-get install xserver-xorg-video-all xserver-xorg-input-all xserver-xorg-core xinit x11-xserver-utils alsamixer pavucontrol
``````
=======
To start the server automatically at startup, edit the ~/.bash_profile file, which is executed when the user logs in, to put the following content (the server starts with startx, but it is also necessary to check that a screen is available to avoid an error, for example, with SSH):
```
if  [ -z $DISPLAY ] &&  [ $(tty) = /dev/tty1 ]; then
    startx
else
    echo "No display detected. Skipping X server start."
fi
```
======
Your system must also be configured so that the user is automatically logged in at startup. The below works on ubuntu server and armbian
````
    sudo systemctl edit getty@tty1.service
````
This will the create a drop-in file (if neccessary) and open it an editor. Add the following, replacing myusername with your user name:
````
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noissue --autologin myusername %I $TERM
Type=idle
````
This will:

Create the folder /etc/systemd/system/getty@tty1.service.d if necessary
Create the file /etc/systemd/system/getty@tty1.service.d/override.conf if necessary



============
We will install, of course, Chromium, but also unclutter, which will allow us to hide the pointer of the mouse:
````
    sudo apt-get install chromium-browser
    sudo apt-get install unclutter
````
Launch at startup
To start them automatically at startup, we create a file~/.xinitrc (this file is executed when the X server starts) which contains the following commands (take care to choose your URL):
````
#!/bin/sh
# Disable power management and screensaver
xset -dpms
xset s off
xset s noblank
# nb you can add the flag --use-fake-device-for-media-stream if audio not present
unclutter &
# Start a browser with necessary flags
chromium-browser --no-sandbox \
--use-fake-ui-for-media-stream \
--autoplay-policy=no-user-gesture-required \
--window-size=$(xrandr | grep '*' | awk '{print $1}' | cut -d 'x' -f 1),$(xrandr | grep '*' | awk '{print $1}' | cut -d 'x' -f 2) \
--start-fullscreen \
--kiosk \
--incognito \
--noerrdialogs \
--disable-translate \
--no-first-run \
--fast-start \
--disable-infobars \
--hide-scrollbars \
--disable-extensions \
--disk-cache-dir=/dev/null \
--user-data-dir=/tmp/chromium3 \
--password-store=basic \
http://localhost

# You can replace 'chromium' with 'google-chrome' or 'firefox' if needed
exec xterm  # Keep the session open
