// Weather API functions for Brisbane, Australia
import { format } from "date-fns"

// Use a generic constant name with no reference to environment variables
const BRISBANE_LAT = "-27.4698"
const BRISBANE_LON = "153.0251"

// Fetch current weather data for Brisbane
export const fetchWeatherData = async () => {
  try {
    // In a real app, this would be a call to a weather API
    // For demo purposes, we'll simulate the API response
    const response = await simulateBrisbaneWeatherAPI()

    return {
      temperature: response.main.temp,
      humidity: response.main.humidity,
      pressure: response.main.pressure,
      description: response.weather[0].description,
      icon: response.weather[0].icon,
      city: "Brisbane",
      windSpeed: response.wind.speed,
      uvIndex: response.uvi || 5, // Brisbane often has high UV
      feelsLike: response.main.feels_like,
    }
  } catch (error) {
    console.error("Failed to fetch Brisbane weather data:", error)
    throw error
  }
}

// Fetch weather forecast for Brisbane
export const fetchWeatherForecast = async () => {
  try {
    // In a real app, this would be a call to a weather API forecast endpoint
    const forecast = []
    const today = new Date()

    // Brisbane seasonal patterns - this is simplified for demo purposes
    // In a real app, this would come from the API
    const isSummer = isBrisbaneSummer(today)

    for (let i = 0; i < 5; i++) {
      const date = new Date()
      date.setDate(today.getDate() + i)

      const weather = simulateBrisbaneForecast(date, isSummer)
      forecast.push(weather)
    }

    return forecast
  } catch (error) {
    console.error("Failed to fetch Brisbane weather forecast:", error)
    throw error
  }
}

// Fetch historical weather data for Brisbane
export const fetchHistoricalWeather = async (date: Date) => {
  try {
    // In a real app, this would call a historical weather API
    // For demo purposes, we'll simulate the API response
    const formattedDate = format(date, "yyyy-MM-dd")
    const response = await simulateBrisbaneHistoricalWeather(date)

    return {
      temperature: response.main.temp,
      humidity: response.main.humidity,
      pressure: response.main.pressure,
      description: response.weather[0].description,
      icon: response.weather[0].icon,
      windSpeed: response.wind.speed,
      uvIndex: response.uvi || 4,
      date: formattedDate,
    }
  } catch (error) {
    console.error(`Failed to fetch Brisbane historical weather for ${date}:`, error)
    throw error
  }
}

// Helper function to determine if it's summer in Brisbane
function isBrisbaneSummer(date: Date) {
  const month = date.getMonth()
  // Summer in Brisbane is December to February (11, 0, 1)
  return month === 11 || month === 0 || month === 1
}

// Simulate Brisbane weather API response
async function simulateBrisbaneWeatherAPI() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const today = new Date()
  const isSummer = isBrisbaneSummer(today)

  // Brisbane weather patterns
  const temp = isSummer
    ? Math.floor(Math.random() * 8) + 28
    : // 28-35°C in summer
      Math.floor(Math.random() * 10) + 15 // 15-25°C in winter

  const humidity = isSummer
    ? Math.floor(Math.random() * 20) + 60
    : // 60-80% in summer
      Math.floor(Math.random() * 30) + 40 // 40-70% in winter

  const pressure = Math.floor(Math.random() * 15) + 1010 // 1010-1025 hPa

  // Brisbane weather conditions
  const conditions = isSummer
    ? ["clear sky", "few clouds", "scattered clouds", "broken clouds", "shower rain", "thunderstorm"]
    : ["clear sky", "few clouds", "scattered clouds", "broken clouds", "light rain"]

  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  // Map condition to icon
  const iconMap: { [key: string]: string } = {
    "clear sky": "01d",
    "few clouds": "02d",
    "scattered clouds": "03d",
    "broken clouds": "04d",
    "shower rain": "09d",
    "light rain": "10d",
    thunderstorm: "11d",
  }

  return {
    main: {
      temp: temp,
      feels_like: temp + (isSummer ? 2 : -1), // Humidity makes it feel hotter in summer
      humidity: humidity,
      pressure: pressure,
    },
    weather: [
      {
        description: condition,
        icon: iconMap[condition],
      },
    ],
    wind: {
      speed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    },
    uvi: isSummer ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 5) + 3, // Higher UV in summer
    name: "Brisbane",
  }
}

// Simulate Brisbane forecast
function simulateBrisbaneForecast(date: Date, isSummer: boolean) {
  // Brisbane weather patterns
  const temp = isSummer
    ? Math.floor(Math.random() * 8) + 28
    : // 28-35°C in summer
      Math.floor(Math.random() * 10) + 15 // 15-25°C in winter

  const minTemp = temp - Math.floor(Math.random() * 5)
  const maxTemp = temp + Math.floor(Math.random() * 5)

  const humidity = isSummer
    ? Math.floor(Math.random() * 20) + 60
    : // 60-80% in summer
      Math.floor(Math.random() * 30) + 40 // 40-70% in winter

  const pressure = Math.floor(Math.random() * 15) + 1010 // 1010-1025 hPa

  // Brisbane weather conditions
  const conditions = isSummer
    ? ["clear sky", "few clouds", "scattered clouds", "broken clouds", "shower rain", "thunderstorm"]
    : ["clear sky", "few clouds", "scattered clouds", "broken clouds", "light rain"]

  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  // Map condition to icon
  const iconMap: { [key: string]: string } = {
    "clear sky": "01d",
    "few clouds": "02d",
    "scattered clouds": "03d",
    "broken clouds": "04d",
    "shower rain": "09d",
    "light rain": "10d",
    thunderstorm: "11d",
  }

  return {
    date: date.toISOString(),
    temperature: temp,
    minTemp: minTemp,
    maxTemp: maxTemp,
    humidity: humidity,
    pressure: pressure,
    description: condition,
    icon: iconMap[condition],
    windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    uvIndex: isSummer ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 5) + 3, // Higher UV in summer
  }
}

// Simulate Brisbane historical weather
async function simulateBrisbaneHistoricalWeather(date: Date) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const isSummer = isBrisbaneSummer(date)

  // Brisbane weather patterns
  const temp = isSummer
    ? Math.floor(Math.random() * 8) + 28
    : // 28-35°C in summer
      Math.floor(Math.random() * 10) + 15 // 15-25°C in winter

  const humidity = isSummer
    ? Math.floor(Math.random() * 20) + 60
    : // 60-80% in summer
      Math.floor(Math.random() * 30) + 40 // 40-70% in winter

  const pressure = Math.floor(Math.random() * 15) + 1010 // 1010-1025 hPa

  // Brisbane weather conditions
  const conditions = isSummer
    ? ["clear sky", "few clouds", "scattered clouds", "broken clouds", "shower rain", "thunderstorm"]
    : ["clear sky", "few clouds", "scattered clouds", "broken clouds", "light rain"]

  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  // Map condition to icon
  const iconMap: { [key: string]: string } = {
    "clear sky": "01d",
    "few clouds": "02d",
    "scattered clouds": "03d",
    "broken clouds": "04d",
    "shower rain": "09d",
    "light rain": "10d",
    thunderstorm: "11d",
  }

  return {
    main: {
      temp: temp,
      feels_like: temp + (isSummer ? 2 : -1), // Humidity makes it feel hotter in summer
      humidity: humidity,
      pressure: pressure,
    },
    weather: [
      {
        description: condition,
        icon: iconMap[condition],
      },
    ],
    wind: {
      speed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    },
    uvi: isSummer ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 5) + 3, // Higher UV in summer
  }
}

// Get Brisbane seasonal information
export const getBrisbaneSeasonalInfo = () => {
  const today = new Date()
  const month = today.getMonth()

  // Brisbane seasons
  if (month === 11 || month === 0 || month === 1) {
    return {
      season: "Summer",
      description: "Hot and humid with afternoon thunderstorms common. High UV index.",
      tips: [
        "Stay hydrated",
        "Use sun protection",
        "Be aware that heat and humidity may worsen inflammatory symptoms",
        "Plan outdoor activities for early morning or evening",
      ],
    }
  } else if (month === 2 || month === 3 || month === 4) {
    return {
      season: "Autumn",
      description: "Mild temperatures with decreasing humidity. Pleasant weather overall.",
      tips: [
        "Good time for outdoor activities",
        "Weather changes may trigger symptoms in some people",
        "Still use sun protection on clear days",
        "Monitor humidity levels which can still be high early in the season",
      ],
    }
  } else if (month === 5 || month === 6 || month === 7) {
    return {
      season: "Winter",
      description: "Mild, dry days with cool nights. Low humidity and minimal rainfall.",
      tips: [
        "Temperature drops at night may trigger joint pain",
        "Excellent time for outdoor activities",
        "Lower humidity may help reduce certain inflammatory symptoms",
        "Still use sun protection as UV can be significant even in winter",
      ],
    }
  } else {
    return {
      season: "Spring",
      description: "Warming temperatures with increasing humidity. Potential for storms later in the season.",
      tips: [
        "Pollen counts increase - may affect those with allergic components to their condition",
        "Gradually increasing temperatures and humidity",
        "Good time to establish outdoor exercise routines before summer heat",
        "Monitor for early storm season impacts",
      ],
    }
  }
}

// Get Brisbane weather triggers for inflammatory conditions
export const getBrisbaneWeatherTriggers = () => {
  return [
    {
      factor: "High Humidity",
      impact: "May increase joint pain and stiffness, especially during Brisbane's humid summer",
      management: "Use air conditioning to reduce indoor humidity, plan activities for early morning",
    },
    {
      factor: "Rapid Weather Changes",
      impact: "Brisbane's storm season can bring rapid barometric pressure changes that may trigger flares",
      management: "Monitor weather forecasts, prepare medications before expected weather changes",
    },
    {
      factor: "High UV Exposure",
      impact: "Brisbane's high UV levels can trigger certain inflammatory skin conditions",
      management: "Use sun protection, limit outdoor activities during peak UV hours (10am-3pm)",
    },
    {
      factor: "Temperature Extremes",
      impact: "Summer heat can worsen fatigue and inflammation; winter evenings can increase joint stiffness",
      management: "Maintain comfortable indoor temperatures, dress appropriately for conditions",
    },
  ]
}
