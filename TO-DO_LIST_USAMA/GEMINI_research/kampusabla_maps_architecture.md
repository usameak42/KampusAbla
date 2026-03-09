# KampusAbla - Location & Mapping Architecture Plan

## 1. Required Google Maps APIs

To support your feature set, you must enable the following specific APIs in your Google Cloud Console:

* **Maps JavaScript API:** Required to render the interactive dynamic map on your React frontend. For the best React/TypeScript integration, use Google's official `@vis.gl/react-google-maps` library.
* **Directions API (or Routes API):** Required to calculate and display the walking/driving path between the pickup location and the destination.
* **Geocoding API:** Required to convert the string addresses entered by parents in the booking form into latitude/longitude coordinates.

## 2. Expected Monthly Cost (500 Active Sessions)

Google Maps Platform operates on a pay-as-you-go model but provides a $200 recurring monthly credit for all users.

For 500 sessions a month, assuming each session triggers 1 map load, 2 geocoding requests (pickup/dropoff), and 1 directions request:

* **Dynamic Maps (Maps JS API):** $7.00 per 1,000 loads. 500 loads = **$3.50**
* **Geocoding API:** $5.00 per 1,000 requests. 1,000 requests = **$5.00**
* **Directions API:** ~$5.00 per 1,000 requests. 500 requests = **$2.50**
* **Real-time tracking:** Updating a marker's position on an already-loaded Maps JS instance does *not* incur additional Google API charges.

**Total Expected Cost:** ~$11.00.
Because this is well below the $200 monthly free tier, your expected monthly Google Maps bill will be **$0.00**.

## 3. API Key Security & Restrictions

A leaked Maps API key can lead to massive unauthorized billing. You must create **two separate API keys** and restrict them accordingly:

* **Frontend Key (Maps JavaScript API):**
* *Application Restriction:* Set to **HTTP Referrers**. Whitelist your exact production domains (e.g., `https://*.kampusabla.com/*`).
* *API Restriction:* Restrict this key so it can *only* call the Maps JavaScript API.


* **Backend Key (Geocoding & Directions APIs):**
* *Application Restriction:* Set to **IP Addresses**. Web services like Geocoding should be executed on your backend servers, so restrict this key strictly to your server's static IP.
* *API Restriction:* Limit this key to the Geocoding and Directions APIs.



## 4. Turkey-Specific Alternatives

While Google Maps is globally standard, Turkey's local mapping ecosystem has strong alternatives that you should evaluate:

* **Yandex Maps:** Highly recommended for Turkey. Yandex dominates the Turkish market in terms of real-time traffic accuracy and local Point of Interest (POI) data. In a major 2026 update, Yandex Turkiye added 1.25 million local organizations to their database. While standard commercial licenses can cost between $2,000 and $10,000 annually based on request volume, Yandex Turkiye has an active startup program offering free access to their Maps API for local businesses.
* **Mapbox:** A highly customizable, developer-friendly alternative. Mapbox is significantly cheaper at scale, offering 100,000 free geocoding requests per month (compared to Google's ~40,000 via the $200 credit) and charging only $0.50 per 1,000 requests thereafter. However, because it relies heavily on OpenStreetMap, its geocoding and real-time traffic accuracy in smaller Turkish neighborhoods might not match Yandex or Google.

## 5. Mobile Browser Tracking & Battery Optimization

Since you are building a React web app (not a native React Native app), you must rely on the HTML5 `navigator.geolocation` API. This presents specific challenges for battery life and tracking stability.

* **The Background Limitation:** Be aware that when a mobile browser is minimized or the screen goes to sleep, geolocation capabilities usually stop working. You must design your UX to instruct sitters to keep the app open during active transport, or plan to migrate to a native app with foreground services later.
* **Utilize `maximumAge`:** GPS drains the battery heavily during initial satellite acquisition. When calling `navigator.geolocation.watchPosition()`, configure the options to accept slightly cached data (e.g., `maximumAge: 5000` for 5 seconds). This prevents the device from constantly firing up the GPS radio for micro-movements.
* **Batch Network Requests:** The fastest way to drain a phone's battery is to keep the cellular network radio constantly active. Do not send every single coordinate change to your server via WebSockets instantly. Instead, batch the coordinates in your React state and flush them to your server every 10-15 seconds.
* **Toggle `enableHighAccuracy`:** Only set `enableHighAccuracy: true` when the sitter is actively moving with the child. If they are paused or have reached the destination, use `clearWatch()` to stop polling the GPS chip, as turning it off is the most effective battery-saving measure.