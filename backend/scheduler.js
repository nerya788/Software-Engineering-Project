const cron = require('node-cron');
const Event = require('./models/Event');
const Notification = require('./models/Notification');
const User = require('./models/User');

module.exports = (io) => {
  // רץ כל דקה (* * * * *) לבדיקה. בסוף תחזיר ל-0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Scheduler running (Socket Mode)...');
    
    try {
      const users = await User.find({});

      for (const user of users) {
        const daysBefore = user.settings?.notification_days ?? 1;
        if (daysBefore < 0) continue;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const events = await Event.find({
          user_id: user._id,
          event_date: { $gte: startOfDay, $lte: endOfDay }
        });

        for (const event of events) {
          const message = `תזכורת: האירוע "${event.title}" מתקיים בעוד ${daysBefore} ימים!`;
          
          const exists = await Notification.findOne({
            user_id: user._id,
            message: message
          });

          if (!exists) {
            const newNotification = await Notification.create({
              user_id: user._id,
              message: message,
              type: 'reminder'
            });
            
            console.log(`🔔 Created notification for ${user.email}`);
            
            // שליחה ב-Socket
            if (io) {
              io.to(user.id).emit('new_notification', {
                id: newNotification._id,
                message: newNotification.message,
                created_at: newNotification.created_at,
                is_read: false
              });
              console.log(`📡 Sent socket to user ${user.id}`);
            } else {
                console.log('⚠️ IO object is missing!');
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Scheduler error:', err);
    }
  });
};