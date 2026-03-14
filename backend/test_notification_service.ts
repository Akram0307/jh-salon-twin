import dotenv from 'dotenv';
dotenv.config();

import { pool } from './src/config/db';
import { NotificationTemplateRepository } from './src/repositories/NotificationTemplateRepository';
import { NotificationLogRepository } from './src/repositories/NotificationLogRepository';
import { dispatchNotification, sendAppointmentConfirmation, dispatchReminderForAppointment } from './src/services/NotificationOrchestrator';

async function testNotificationService() {
    console.log('🧪 Testing Notification Service...');
    
    try {
        // Use existing salon ID from database
        const testSalonId = 'dc3a3381-b7f1-443d-b220-8e68fdcb6911';
        const testUserId = '45221e89-6857-4808-8a40-99d6bf074374';
        
        // Test 1: Create notification template
        console.log('\n1. Testing NotificationTemplateRepository...');
        const template = await NotificationTemplateRepository.create({
            salon_id: testSalonId,
            name: 'Test Appointment Reminder',
            type: 'email',
            subject: 'Reminder: Your appointment tomorrow',
            body: 'Hi {{client_name}}, this is a reminder for your appointment tomorrow at {{time}}.',
            variables: ['client_name', 'time']
        });
        console.log('✅ Template created:', template.id);
        
        // Test 2: Find templates by salon ID
        const templates = await NotificationTemplateRepository.findBySalonId(testSalonId);
        console.log('✅ Templates found:', templates.length);
        
        // Test 3: Update template
        const updatedTemplate = await NotificationTemplateRepository.update(template.id, {
            subject: 'Updated: Appointment Reminder'
        });
        console.log('✅ Template updated:', updatedTemplate?.subject);
        
        // Test 4: Create notification log
        console.log('\n2. Testing NotificationLogRepository...');
        const log = await NotificationLogRepository.create({
            salon_id: testSalonId,
            user_id: testUserId,
            user_type: 'owner',
            template_id: template.id,
            type: 'email',
            recipient: 'test@example.com',
            content: 'Test notification content',
            status: 'pending'
        });
        console.log('✅ Notification log created:', log.id);
        
        // Test 5: Mark as sent
        const sentLog = await NotificationLogRepository.markAsSent(log.id);
        console.log('✅ Notification marked as sent:', sentLog?.status);
        
        // Test 6: Find logs by salon ID with filters
        const logs = await NotificationLogRepository.findBySalonId(testSalonId, 10, 0, 'email', 'sent');
        console.log('✅ Logs found with filters:', logs.length);
        
        // Test 7: Get notification stats
        const stats = await NotificationLogRepository.getStats(testSalonId, 30);
        console.log('✅ Notification stats:', {
            total: stats.summary.total,
            sent: stats.summary.sent,
            failed: stats.summary.failed
        });
        
        // Test 8: Dispatch notification (email)
        console.log('\n3. Testing NotificationOrchestrator...');
        const emailResult = await dispatchNotification({
            salonId: testSalonId,
            userId: testUserId,
            userType: 'owner',
            type: 'email',
            subject: 'Test Notification',
            content: '<p>This is a test notification</p>',
            recipient: 'test@example.com'
        });
        console.log('✅ Email notification dispatched:', emailResult);
        
        // Test 9: Dispatch notification (SMS)
        const smsResult = await dispatchNotification({
            salonId: testSalonId,
            userId: testUserId,
            userType: 'owner',
            type: 'sms',
            content: 'This is a test SMS notification',
            recipient: '+1234567890'
        });
        console.log('✅ SMS notification dispatched:', smsResult);
        
        // Test 10: Delete template
        await NotificationTemplateRepository.delete(template.id);
        console.log('✅ Template deleted');
        
        console.log('\n✅ All notification service tests passed!');
        
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testNotificationService();
