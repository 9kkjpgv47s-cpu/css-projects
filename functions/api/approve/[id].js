// Cloudflare Pages Function - Handle booking approvals
// GET /api/approve/:id

export async function onRequestGet(context) {
    const { params, env, request } = context;
    const bookingId = params.id;

    try {
        // Get booking from KV
        const bookingData = await env.BOOKINGS.get(bookingId);

        if (!bookingData) {
            return new Response(renderPage('Booking Not Found', 'This booking request has expired or does not exist.', 'error'), {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        const booking = JSON.parse(bookingData);

        // Check if already approved
        if (booking.status === 'approved') {
            return new Response(renderPage('Already Approved', `This booking with ${booking.name} was already approved.`, 'info'), {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Mark as approved
        booking.status = 'approved';
        booking.approvedAt = new Date().toISOString();

        await env.BOOKINGS.put(bookingId, JSON.stringify(booking), {
            expirationTtl: 60 * 60 * 24 * 30 // 30 days
        });

        // Format date for email
        const dateObj = new Date(booking.date + 'T' + booking.time);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format time for email
        const [hours, minutes] = booking.time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const formattedTime = `${hour12}:${minutes} ${ampm}`;

        // Send confirmation email to visitor
        const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f7; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1f1f2e; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 25px; }
        .details { background: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details p { margin: 10px 0; }
        .label { font-weight: 600; color: #3b82f6; }
        .footer { color: #666; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Your Meeting is Confirmed!</h1>
            <p class="subtitle">Hi ${booking.name}, your consultation has been approved.</p>

            <div class="details">
                <p><span class="label">Date:</span> ${formattedDate}</p>
                <p><span class="label">Time:</span> ${formattedTime}</p>
                <p><span class="label">Duration:</span> ${booking.duration} minutes</p>
            </div>

            <p>We look forward to speaking with you. If you need to reschedule, please reply to this email or contact us at <a href="mailto:DEasterling@cssolutions.services">DEasterling@cssolutions.services</a>.</p>

            <div class="footer">
                <strong>Catalyst Strategy Solutions</strong><br>
                DEasterling@cssolutions.services<br>
                (760) 421-4397
            </div>
        </div>
    </div>
</body>
</html>
        `;

        // Send confirmation via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Catalyst Strategy Solutions <bookings@cssolutions.services>',
                to: [booking.email],
                subject: `Meeting Confirmed - ${formattedDate} at ${formattedTime}`,
                html: confirmationHtml,
                reply_to: 'DEasterling@cssolutions.services'
            })
        });

        if (!emailResponse.ok) {
            console.error('Confirmation email failed:', await emailResponse.text());
            return new Response(renderPage('Approved with Warning', `Booking approved, but confirmation email to ${booking.email} may have failed. Please contact them directly.`, 'warning'), {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        return new Response(renderPage(
            'Booking Approved!',
            `Confirmation email sent to ${booking.email}.<br><br><strong>Meeting Details:</strong><br>${booking.name}<br>${formattedDate} at ${formattedTime}<br>${booking.duration} minutes`,
            'success'
        ), {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Approval error:', error);
        return new Response(renderPage('Error', 'Something went wrong processing this approval. Please try again.', 'error'), {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

function renderPage(title, message, type) {
    const colors = {
        success: { bg: '#dcfce7', border: '#22c55e', icon: '&#10003;' },
        error: { bg: '#fee2e2', border: '#ef4444', icon: '&#10007;' },
        warning: { bg: '#fef3c7', border: '#f59e0b', icon: '&#9888;' },
        info: { bg: '#dbeafe', border: '#3b82f6', icon: '&#8505;' }
    };
    const color = colors[type] || colors.info;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Catalyst Strategy Solutions</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1f1f2e;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${color.bg};
            border: 2px solid ${color.border};
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
            color: ${color.border};
        }
        h1 { color: #1f1f2e; margin-bottom: 15px; font-size: 24px; }
        p { color: #666; line-height: 1.6; }
        a { color: #3b82f6; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">${color.icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
    </div>
</body>
</html>
    `;
}
