import dotenv from 'dotenv';
dotenv.config();

import { pool } from './src/config/db';
import { UserSettingsRepository } from './src/repositories/UserSettingsRepository';
import { TwoFactorAuthRepository } from './src/repositories/TwoFactorAuthRepository';
import { BillingInfoRepository } from './src/repositories/BillingInfoRepository';
import { NotificationTemplateRepository } from './src/repositories/NotificationTemplateRepository';
import { NotificationLogRepository } from './src/repositories/NotificationLogRepository';

async function testSettingsEndpoints() {
    console.log('🧪 Testing Settings Endpoints...');
    
    try {
        // Use existing salon and owner IDs from database
        const testSalonId = 'dc3a3381-b7f1-443d-b220-8e68fdcb6911';
        const testOwnerId = '45221e89-6857-4808-8a40-99d6bf074374';
        const testUserId = testOwnerId; // For owner, user_id is the same as owner_id
        
        // Test 1: Create user settings
        console.log('\n1. Testing UserSettingsRepository...');
        const settings = await UserSettingsRepository.upsert({
            user_id: testUserId,
            user_type: 'owner',
            salon_id: testSalonId,
            profile_data: { bio: 'Test owner', avatar_url: 'https://example.com/avatar.jpg' },
            notification_preferences: { email: true, sms: true, push: false }
        });
        console.log('✅ UserSettings created:', settings.id);
        
        // Test 2: Find user settings
        const foundSettings = await UserSettingsRepository.findByUserId(testUserId, 'owner');
        console.log('✅ UserSettings found:', foundSettings?.id);
        
        // Test 3: Update notification preferences
        const updatedSettings = await UserSettingsRepository.updateNotificationPreferences(
            testUserId,
            'owner',
            { email: false, sms: true, push: true }
        );
        console.log('✅ Notification preferences updated:', updatedSettings?.notification_preferences);
        
        // Test 4: Create 2FA record
        console.log('\n2. Testing TwoFactorAuthRepository...');
        const twoFactorAuth = await TwoFactorAuthRepository.enable(
            testUserId,
            'owner',
            'JBSWY3DPEHPK3PXP'
        );
        console.log('✅ 2FA enabled:', twoFactorAuth.id);
        
        // Test 5: Verify 2FA
        const verifiedAuth = await TwoFactorAuthRepository.verify(testUserId, 'owner');
        console.log('✅ 2FA verified:', verifiedAuth?.verified_at ? 'Yes' : 'No');
        
        // Test 6: Check 2FA status using findByUserId
        const authRecord = await TwoFactorAuthRepository.findByUserId(testUserId, 'owner');
        console.log('✅ 2FA enabled status:', authRecord?.enabled ? 'Enabled' : 'Disabled');
        
        // Test 7: Create billing info
        console.log('\n3. Testing BillingInfoRepository...');
        const billing = await BillingInfoRepository.create({
            salon_id: testSalonId,
            owner_id: testOwnerId,
            plan: 'premium',
            payment_method: { type: 'card', last4: '4242' },
            billing_address: { city: 'New York', country: 'US' }
        });
        console.log('✅ Billing info created:', billing.id);
        
        // Test 8: Find billing info
        const foundBilling = await BillingInfoRepository.findBySalonId(testSalonId);
        console.log('✅ Billing info found:', foundBilling?.id);
        
        // Test 9: Create notification template
        console.log('\n4. Testing NotificationTemplateRepository...');
        const template = await NotificationTemplateRepository.create({
            salon_id: testSalonId,
            name: 'Appointment Reminder',
            type: 'email',
            subject: 'Reminder: Your appointment tomorrow',
            body: 'Hi {{client_name}}, this is a reminder for your appointment tomorrow at {{time}}.',
            variables: ['client_name', 'time']
        });
        console.log('✅ Notification template created:', template.id);
        
        // Test 10: Create notification log
        console.log('\n5. Testing NotificationLogRepository...');
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
        
        // Test 11: Mark as sent
        const sentLog = await NotificationLogRepository.markAsSent(log.id);
        console.log('✅ Notification marked as sent:', sentLog?.status);
        
        console.log('\n✅ All settings endpoint tests passed!');
        
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testSettingsEndpoints();
