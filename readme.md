# OSWeb

Copyright 2016 - 2025 Jaap Bos (@shyras), Daniel Schreij (@dschreij), and Sebastiaan Mathôt (@smathot)


## About

OSWeb is an online runtime for OpenSesame experiments. OpenSesame is a open-source program for creating behavioral experiments. For more information, see:

- <http://osdoc.cogsci.nl/>

The easiest way to use OSWeb in OpenSesame is using the OSWeb extension (`opensesame-extension-osweb`) which is pre-installed in most distributions of OpenSesame, or can be install through `pip`:

    pip install opensesame-extension-osweb

The source code for the extension can be found at:

- <https://github.com/open-cogsci/opensesame-extension-osweb/>


## How to build

OSWeb is built using node.js and webpack, and therefore the installation process should be pretty straightforward. Currently, node 14.18.3 and npm 6.14.15 are used for development. More recent versions are known to cause installation problems, at least on some systems.

First, go to the root of the OSWEB folder and install the dependencies with the command:

    npm ci

Then build OSWEB by running:

    npm run dev

This will generate the application in the `public_html` folder.

If you want to build OSweb with production settings you can run:

    npm run prod

The production version is uglified and minified, which results in smaller file sizes, and thus shorter loading times when serving Osweb from a web server. The building process does take considerably longer because of these steps.


## How to run

Open `public_html/index.html` in a webbrowser!

Alternatively, you can start a development server with:

    npm start

Once it is started, you can visit `http://localhost:3000` in your browser and you should see the osweb interface. The devserver is especially useful if you are working on the source of osweb itself, because it employs hot module reloading (HMR). This implies that whenever you change a file and save it to disk, it is automatically reloaded in the browser without having to refresh the page each time.


## Unit tests

Unit tests can be run with

    npm test


## License

OSWEB is distributed under the terms of the GNU General Public License 3. The full license should be included in the file COPYING, or can be obtained from:

- <http://www.gnu.org/licenses/gpl.txt>
