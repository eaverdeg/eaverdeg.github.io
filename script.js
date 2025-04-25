const SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const SSID_CHAR_UUID = '00002a57-0000-1000-8000-00805f9b34fb';
const PASSWORD_CHAR_UUID = '00002a58-0000-1000-8000-00805f9b34fb';
let ssidCharacteristic;
let passwordCharacteristic;
let arduinoIP = null;

async function connectBLE() {
  const status = document.getElementById('status');
  try {
    status.textContent = 'Requesting Bluetooth device...';
    status.className = ''; // Reset status color
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Arduino' }],
      optionalServices: [SERVICE_UUID]
    });

    status.textContent = 'Connecting...';
    status.className = ''; // Reset status color
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    ssidCharacteristic = await service.getCharacteristic(SSID_CHAR_UUID);
    passwordCharacteristic = await service.getCharacteristic(PASSWORD_CHAR_UUID);

    status.textContent = 'Connected to BLE device!';
    status.className = 'success'; // Green text for success

    device.addEventListener('gattserverdisconnected', () => {
      status.textContent = 'Disconnected from BLE device';
      status.className = 'warning'; // Yellow text for warning
      console.warn('BLE device disconnected.');
    });
  } catch (error) {
    console.error('Error:', error);
    status.textContent = 'Error: ' + error.message;
    status.className = 'error'; // Red text for error
  }
}

async function connectWiFi() {
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;
  const status = document.getElementById('status');
  if (!ssid || !password) {
    status.textContent = 'Please enter both SSID and password.';
    status.className = 'error'; // Red text for error
    return;
  }

  try {
    // Write SSID to the ssidCharacteristic
    const ssidEncoder = new TextEncoder();
    const ssidData = ssidEncoder.encode(ssid);
    await ssidCharacteristic.writeValue(ssidData);
    console.log(`SSID written: ${ssid}`);

    // Write Password to the passwordCharacteristic
    const passwordEncoder = new TextEncoder();
    const passwordData = passwordEncoder.encode(password);
    await passwordCharacteristic.writeValue(passwordData);
    console.log(`Password written: ${password}`);

    status.textContent = 'Wi-Fi credentials sent. Waiting for Arduino to connect...';
    status.className = 'warning'; // Yellow text for waiting
  } catch (error) {
    console.error('Error sending Wi-Fi credentials:', error);
    status.textContent = 'Failed to send Wi-Fi credentials.';
    status.className = 'error'; // Red text for error
  }
}

async function fetchArduinoIP() {
  const status = document.getElementById('arduino-ip-display');
  try {
    const response = await fetch('http://192.168.0.233/get_ip'); // Replace with the Arduino's known IP or hostname
    if (response.ok) {
      arduinoIP = await response.text();
      status.textContent = `Arduino IP: ${arduinoIP}`;
      console.log(`Arduino IP fetched: ${arduinoIP}`);
    } else {
      throw new Error(`HTTP error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching Arduino IP:', error);
    status.textContent = 'Arduino IP: Not available';
  }
}

async function lightUpLEDs() {
  const status = document.getElementById('status');

  if (!arduinoIP) {
    status.textContent = 'Arduino IP not available. Fetching IP...';
    await fetchArduinoIP(); // Try to fetch the IP address
    if (!arduinoIP) {
      status.textContent = 'Failed to fetch Arduino IP.';
      status.className = 'error'; // Red text for error
      return;
    }
  }

  console.log(`Sending request to: http://${arduinoIP}/light_up_leds`);

  try {
    const response = await fetch(`http://${arduinoIP}/light_up_leds`);
    if (response.ok) {
      const result = await response.text();
      status.textContent = `LEDs lit up successfully! Response: ${result}`;
      status.className = 'success'; // Green text for success
    } else {
      throw new Error(`HTTP error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error lighting up LEDs:', error);
    status.textContent = 'Failed to light up LEDs.';
    status.className = 'error'; // Red text for error
  }
}

// Periodically fetch the Arduino's IP address
setInterval(fetchArduinoIP, 5000); // Poll every 5 seconds

function saveWiFiCredentials() {
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;

  if (!ssid || !password) {
    console.error('SSID or password is missing');
    return;
  }

  console.log(`Saving Wi-Fi credentials: SSID=${ssid}, Password=${password}`);
  // Optionally, store the credentials in localStorage
  localStorage.setItem('wifiSSID', ssid);
  localStorage.setItem('wifiPassword', password);
}

function buttonClick(buttonId) {
  console.log(`Button clicked: ${buttonId}`);
  const status = document.getElementById('status');
  status.textContent = `Button clicked: ${buttonId}`;
  status.className = 'success'; // Green text for success
}