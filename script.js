
        // Global state for QR code instance
        let qrcodeInstance = null;
        let isLocationFetched = false;
        let lat = null;
        let lng = null;

        // Constants
        const GEO_INPUT = document.getElementById('geo-input');
        const ADDR_INPUT = document.getElementById('address-input');
        const CITY_INPUT = document.getElementById('city-input');
        const STATE_INPUT = document.getElementById('state-input');
        const QR_OUTPUT_DIV = document.getElementById('qrcode-output');
        const MESSAGE_BOX = document.getElementById('message-box');
        const GET_LOCATION_BTN = document.getElementById('get-location-btn');
        const GENERATE_BTN = document.getElementById('generate-qr-btn');
        const SPINNER = document.getElementById('spinner');
        const BTN_TEXT = document.getElementById('btn-text');
        
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        /**
         * Utility function to display messages in the UI.
         * @param {string} message - The message content.
         * @param {string} type - 'success', 'error', or 'info'.
         */
        function displayMessage(message, type) {
            MESSAGE_BOX.textContent = message;
            MESSAGE_BOX.className = "p-3 mb-4 rounded-lg text-sm text-center";

            if (type === 'error') {
                MESSAGE_BOX.classList.add('bg-red-100', 'text-red-800', 'border-red-400', 'border');
            } else if (type === 'success') {
                MESSAGE_BOX.classList.add('bg-green-100', 'text-green-800', 'border-green-400', 'border');
            } else { // info
                MESSAGE_BOX.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-400', 'border');
            }
            MESSAGE_BOX.classList.remove('hidden');
        }

        /**
         * Clears all inputs and resets state.
         */
        function resetInputs() {
            ADDR_INPUT.value = '';
            CITY_INPUT.value = '';
            STATE_INPUT.value = '';
            GEO_INPUT.value = '';
            isLocationFetched = false;
            lat = null;
            lng = null;
            MESSAGE_BOX.classList.add('hidden');
        }

        /**
         * Generates the Google Maps URL based on the current state (geolocation or manual input).
         * @returns {string|null} The Google Maps URL or null if no valid input is found.
         */
        function createMapUrl() {
            let mapUrl = null;

            if (isLocationFetched && lat !== null && lng !== null) {
                // Use Geolocation
                mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                displayMessage("QR code generated from your current latitude/longitude.", 'success');
            } else if (ADDR_INPUT.value || CITY_INPUT.value || STATE_INPUT.value) {
                // Use Manual Address
                const address = `${ADDR_INPUT.value} ${CITY_INPUT.value} ${STATE_INPUT.value}`;
                const encodedAddress = encodeURIComponent(address.trim());
                if (encodedAddress) {
                    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    displayMessage("QR code generated from the manual address.", 'success');
                }
            }

            return mapUrl;
        }

        /**
         * Generates the QR code and updates the UI.
         */
        function generateQRCodeHandler() {
            const mapUrl = createMapUrl();

            if (!mapUrl) {
                displayMessage("Please provide a valid location, either by clicking 'Get Location' or entering a manual address.", 'error');
                return;
            }

            // Clear previous QR code
            QR_OUTPUT_DIV.innerHTML = '';
            
            // Re-initialize or update QR code instance
            if (qrcodeInstance) {
                qrcodeInstance.makeCode(mapUrl);
            } else {
                qrcodeInstance = new QRCode(QR_OUTPUT_DIV, {
                    text: mapUrl,
                    width: 256,
                    height: 256,
                    colorDark: "#333333",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
            
            // Add a slight animation to the QR container
            QR_OUTPUT_DIV.style.opacity = 0;
            setTimeout(() => {
                QR_OUTPUT_DIV.style.opacity = 1;
            }, 50);
        }

        /**
         * Handles successful geolocation retrieval.
         * @param {GeolocationPosition} position - The geolocation data.
         */
        function geolocationSuccess(position) {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            isLocationFetched = true;
            
            // Update UI
            GEO_INPUT.value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
            
            // Reset manual inputs to indicate priority is on geo
            ADDR_INPUT.value = '';
            CITY_INPUT.value = '';
            STATE_INPUT.value = '';
            
            displayMessage("Location fetched successfully! Click 'Generate QR Code'.", 'info');
            
            // Reset button state
            GET_LOCATION_BTN.disabled = false;
            SPINNER.classList.add('hidden');
            BTN_TEXT.textContent = 'Get My Current Location';
        }

        /**
         * Handles failed geolocation retrieval.
         * @param {GeolocationPositionError} error - The error object.
         */
        function geolocationError(error) {
            let message = "Geolocation failed. Please enter location manually.";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "Geolocation permission denied. Please enable it in your browser settings.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    message = "The request to get user location timed out.";
                    break;
            }
            
            displayMessage(message, 'error');
            
            // Reset button state
            GET_LOCATION_BTN.disabled = false;
            SPINNER.classList.add('hidden');
            BTN_TEXT.textContent = 'Get My Current Location';
        }

        /**
         * Initiates the geolocation process.
         */
        function getGeolocationHandler() {
            if (!navigator.geolocation) {
                displayMessage("Your browser does not support Geolocation.", 'error');
                return;
            }
            
            // Set button state to loading
            GET_LOCATION_BTN.disabled = true;
            SPINNER.classList.remove('hidden');
            BTN_TEXT.textContent = 'Fetching...';

            // Clear previous manual entries and geo indicator
            resetInputs();
            
            // Request location with timeout and high accuracy
            navigator.geolocation.getCurrentPosition(
                geolocationSuccess,
                geolocationError,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }

        // Attach event listeners
        GET_LOCATION_BTN.addEventListener('click', getGeolocationHandler);
        GENERATE_BTN.addEventListener('click', generateQRCodeHandler);
        
        // When manual inputs are changed, clear the geolocation state
        [ADDR_INPUT, CITY_INPUT, STATE_INPUT].forEach(input => {
            input.addEventListener('input', () => {
                if (isLocationFetched) {
                    isLocationFetched = false;
                    lat = null;
                    lng = null;
                    GEO_INPUT.value = 'Manual address entered. Geolocation data cleared.';
                }
            });
        });

        // Initial setup/animation trigger
        window.onload = () => {
             // Show info message on load
             displayMessage("Click 'Get My Current Location' or enter an address manually.", 'info');
        };
