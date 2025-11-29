const cron = require('node-cron');
const Event = require('./models/Event');
const Notification = require('./models/Notification');

// הפונקציה תרוץ כל יום בחצות (00:00)
// הסימון '0 0 * * *' אומר: דקה 0, שעה 0
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Scheduler running: Checking for upcoming events...');
  
  try {
    // חישוב התאריך של מחר
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // איפוס שעות כדי להשוות רק תאריכים
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    // מציאת אירועים שקורים מחר
    const upcomingEvents = await Event.find({
      event_date: {
        $gte: startOfTomorrow,
        $lte: endOfTomorrow
      }
    });

    for (const event of upcomingEvents) {
      // בדיקה אם כבר קיימת התראה לאירוע הזה כדי למנוע כפילויות
      // (בדיקה פשוטה לפי תוכן ההודעה והמשתמש)
      const message = `תזכורת: האירוע "${event.title}" מתקיים מחר!`;
      
      const exists = await Notification.findOne({
        user_id: event.user_id,
        message: message
      });

      if (!exists) {
        await Notification.create({
          user_id: event.user_id,
          message: message,
          type: 'reminder'
        });
        console.log(`🔔 Notification created for event: ${event.title}`);
      }
    }
  } catch (err) {
    console.error('❌ Scheduler error:', err);
  }
});

module.exports = cron;