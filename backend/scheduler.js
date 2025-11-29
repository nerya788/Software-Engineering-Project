const cron = require('node-cron');
const Event = require('./models/Event');
const Notification = require('./models/Notification');
const User = require('./models/User'); // מייבאים את מודל המשתמש

// רץ כל יום בחצות
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Scheduler running: Checking custom preferences...');
  
  try {
    // 1. מביאים את כל המשתמשים
    const users = await User.find({});

    for (const user of users) {
      // בודקים מה ההגדרה של המשתמש (ברירת מחדל: 1 יום)
      const daysBefore = user.settings?.notification_days ?? 1;
      
      // אם המשתמש ביטל התראות (למשל קבע -1), מדלגים
      if (daysBefore < 0) continue;

      // 2. מחשבים את תאריך היעד עבור המשתמש הזה
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // 3. מחפשים אירועים של המשתמש שנופלים ביום הזה
      const events = await Event.find({
        user_id: user._id,
        event_date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      // 4. יוצרים התראות
      for (const event of events) {
        const message = `תזכורת: האירוע "${event.title}" מתקיים בעוד ${daysBefore} ימים!`;
        
        // מונעים כפילויות
        const exists = await Notification.findOne({
          user_id: user._id,
          message: message
        });

        if (!exists) {
          await Notification.create({
            user_id: user._id,
            message: message,
            type: 'reminder'
          });
          console.log(`🔔 Notification created for ${user.email}: ${event.title}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Scheduler error:', err);
  }
});

module.exports = cron;