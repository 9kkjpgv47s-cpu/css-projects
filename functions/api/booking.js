// Cloudflare Pages Function - Handle booking form submissions
// POST /api/booking

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const data = await request.json();

        // Validate required fields
        const required = ['name', 'email', 'date', 'time', 'duration', 'reason'];
        for (const field of required) {
            if (!data[field]) {
                return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return new Response(JSON.stringify({ error: 'Invalid email address' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate unique booking ID
        const bookingId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // Store booking in KV
        const booking = {
            id: bookingId,
            ...data,
            status: 'pending',
            createdAt
        };

        await env.BOOKINGS.put(bookingId, JSON.stringify(booking), {
            expirationTtl: 60 * 60 * 24 * 30 // 30 days
        });

        // Format date for email
        const dateObj = new Date(data.date + 'T' + data.time);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format time for email
        const [hours, minutes] = data.time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const formattedTime = `${hour12}:${minutes} ${ampm}`;

        // Build approval URL
        const baseUrl = new URL(request.url).origin;
        const approveUrl = `${baseUrl}/api/approve/${bookingId}`;

        // Send notification email to Dominic
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #1f1f2e; margin-bottom: 20px; }
        .details { background: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details p { margin: 8px 0; }
        .label { font-weight: 600; color: #666; }
        .approve-btn {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .notes { background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>New Booking Request</h1>

        <div class="details">
            <p><span class="label">Name:</span> ${data.name}</p>
            <p><span class="label">Business:</span> ${data.business || 'Not provided'}</p>
            <p><span class="label">Email:</span> ${data.email}</p>
            <p><span class="label">Date:</span> ${formattedDate}</p>
            <p><span class="label">Time:</span> ${formattedTime}</p>
            <p><span class="label">Duration:</span> ${data.duration} minutes</p>
            <p><span class="label">Reason:</span> ${data.reason}</p>
            ${data.notes ? `<div class="notes"><span class="label">Notes:</span><br>${data.notes}</div>` : ''}
        </div>

        <a href="${approveUrl}" class="approve-btn">Approve This Booking</a>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Clicking approve will send a confirmation email to ${data.email}
        </p>
    </div>
</body>
</html>
        `;

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Catalyst Strategy Solutions <bookings@send.cssolutions.services>',
                to: ['DEasterling@cssolutions.services'],
                subject: `New Booking Request: ${data.name} - ${formattedDate}`,
                html: emailHtml
            })
        });

        if (!emailResponse.ok) {
            console.error('Email send failed:', await emailResponse.text());
            // Still return success - booking is saved, email can be retried
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Booking request submitted successfully',
            bookingId
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Booking error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process booking request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
