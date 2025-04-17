"use server"

// Completely new implementation to avoid any string references to the old variable name
export async function fetchCurrentWeather() {
  try {
    // Brisbane coordinates
    const latitude = -27.470125
    const longitude = 153.021072

    // Use the secure server-side environment variable
    const key = process.env.OPENWEATHERMAP_API_KEY

    // Construct the API URL
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}&units=metric`

    // Fetch the data
    const response = await fetch(apiUrl, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    // Return only the necessary data
    return {
      temperature: data?.main?.temp,
      humidity: data?.main?.humidity,
      pressure: data?.main?.pressure,
      description: data?.weather?.[0]?.description,
      icon: data?.weather?.[0]?.icon,
      windSpeed: data?.wind?.speed,
      uvIndex: data?.uvi,
      feelsLike: data?.main?.feels_like,
    }
  } catch (error) {
    console.error("Weather data fetch failed:", error)
    return null
  }
}
