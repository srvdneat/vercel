// Browser notification functions

// Check if browser supports notifications
const checkNotificationSupport = () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications")
    return false
  }
  return true
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!checkNotificationSupport()) return false

  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return Notification.permission === "granted"
}

// Parse time string to get hours and minutes
const parseTimeString = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number)
  return { hours, minutes }
}

// Schedule a notification
export const scheduleNotification = (id: string, title: string, body: string, timeString: string) => {
  if (!checkNotificationSupport()) return

  // Request permission if not already granted
  requestNotificationPermission()

  // Parse time
  const { hours, minutes } = parseTimeString(timeString)

  // Calculate when to show notification
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hours, minutes, 0, 0)

  // If time has already passed today, schedule for tomorrow
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  // Calculate delay in milliseconds
  const delay = scheduledTime.getTime() - now.getTime()

  // Store timeout ID in localStorage to persist across page refreshes
  const timeoutId = setTimeout(() => {
    showNotification(title, body)

    // Reschedule for tomorrow
    scheduleNotification(id, title, body, timeString)
  }, delay)

  // Store timeout ID
  localStorage.setItem(`notification_${id}`, timeoutId.toString())

  return timeoutId
}

// Show a notification
const showNotification = (title: string, body: string) => {
  if (!checkNotificationSupport()) return

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }
}

// Cancel a scheduled notification
export const cancelNotification = (id: string) => {
  const timeoutIdString = localStorage.getItem(`notification_${id}`)

  if (timeoutIdString) {
    const timeoutId = Number.parseInt(timeoutIdString)
    clearTimeout(timeoutId)
    localStorage.removeItem(`notification_${id}`)
  }
}

// Initialize notifications on page load
export const initializeNotifications = () => {
  if (typeof window === "undefined") return

  // Request permission
  requestNotificationPermission()

  // Restore scheduled notifications from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("notification_")) {
      // We would need to store more information to properly restore notifications
      // This is just a placeholder for the concept
    }
  })
}
