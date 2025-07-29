// Fix Chat Messages System Test
import fetch from 'node-fetch';

async function testChatMessagesSystem() {
  console.log('🔧 Testing Chat Messages System - Full Workflow');
  console.log('=================================================\n');

  try {
    // Step 1: Create a new chat with proper session
    console.log('📱 Step 1: Creating new chat...');
    const createChatResponse = await fetch('http://localhost:5000/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sessionId=3wy0sdany25'
      },
      body: JSON.stringify({
        title: 'Test Chat Messages System'
      })
    });
    
    const createChatData = await createChatResponse.json();
    console.log('Chat creation result:', createChatData);
    
    if (!createChatData.id) {
      throw new Error('Failed to create chat');
    }
    
    const chatId = createChatData.id;
    console.log(`✅ Chat created with ID: ${chatId}\n`);
    
    // Step 2: Send a message and track the process
    console.log('💬 Step 2: Sending test message...');
    const sendMessageResponse = await fetch('http://localhost:5000/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sessionId=3wy0sdany25'
      },
      body: JSON.stringify({
        message: 'What are the main benefits of TracerPay processing?',
        chatId: chatId
      })
    });
    
    const sendMessageData = await sendMessageResponse.json();
    console.log('Message send result:', {
      success: sendMessageResponse.ok,
      status: sendMessageResponse.status,
      hasResponse: !!sendMessageData.message || !!sendMessageData.response,
      responseLength: (sendMessageData.message || sendMessageData.response || '').length
    });
    
    if (sendMessageResponse.ok) {
      console.log(`✅ Message sent successfully, response generated\n`);
      
      // Step 3: Test messages endpoint immediately
      console.log('📋 Step 3: Testing messages endpoint...');
      const messagesResponse = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
        headers: {
          'Cookie': 'sessionId=3wy0sdany25'
        }
      });
      
      console.log('Messages endpoint result:', {
        status: messagesResponse.status,
        contentType: messagesResponse.headers.get('content-type'),
        ok: messagesResponse.ok
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        console.log(`✅ Messages retrieved: ${messagesData.length} messages found`);
        
        if (messagesData.length > 0) {
          console.log('📝 Message content preview:');
          messagesData.forEach((msg, i) => {
            console.log(`   ${i + 1}. ${msg.role}: "${msg.content.substring(0, 60)}..."`);
          });
        } else {
          console.log('⚠️ No messages found in response - checking database directly...');
        }
      } else {
        console.log('❌ Messages endpoint failed');
        const errorText = await messagesResponse.text();
        console.log('Error response:', errorText.substring(0, 200));
      }
      
      // Step 4: Verify database content directly
      console.log('\n🗄️ Step 4: Database verification...');
      const dbVerifyResponse = await fetch('http://localhost:5000/api/admin/chat-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'sessionId=mqc3hc39sma'
        },
        body: JSON.stringify({ chatId })
      });
      
      if (dbVerifyResponse.ok) {
        const dbData = await dbVerifyResponse.json();
        console.log('Database verification:', dbData);
      }
      
    } else {
      console.log(`❌ Message sending failed: ${sendMessageResponse.status}`);
      const errorData = await sendMessageResponse.text();
      console.log('Error details:', errorData.substring(0, 200));
    }
    
    console.log('\n🎯 CHAT SYSTEM DIAGNOSIS COMPLETE');
    console.log('==================================');
    console.log('This test helps identify where the chat message workflow breaks down.');
    console.log('Key areas: Chat creation, message sending, message storage, message retrieval');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testChatMessagesSystem();