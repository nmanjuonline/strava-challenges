export const subscribePage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscribe to Strava Scout</title>
    <style>
        :root {
            --primary: #fc4c02;
            --primary-hover: #e34402;
            --bg: #f9f9f9;
            --surface: #ffffff;
            --text: #333333;
            --text-light: #666666;
            --border: #e0e0e0;
            --success: #4caf50;
            --error: #f44336;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            background-color: var(--surface);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        h1 {
            color: var(--primary);
            margin-top: 0;
            font-size: 24px;
        }
        p {
            color: var(--text-light);
            line-height: 1.5;
            margin-bottom: 24px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        input[type="email"] {
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
        }
        input[type="email"]:focus {
            border-color: var(--primary);
        }
        button {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: var(--primary-hover);
        }
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .message {
            margin-top: 16px;
            padding: 10px;
            border-radius: 6px;
            display: none;
        }
        .message.success {
            display: block;
            background-color: rgba(76, 175, 80, 0.1);
            color: var(--success);
            border: 1px solid rgba(76, 175, 80, 0.2);
        }
        .message.error {
            display: block;
            background-color: rgba(244, 67, 54, 0.1);
            color: var(--error);
            border: 1px solid rgba(244, 67, 54, 0.2);
        }
        .back-link {
            display: inline-block;
            margin-top: 24px;
            color: var(--text-light);
            text-decoration: none;
            font-size: 14px;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Strava Scout</h1>
        <p>Subscribe to receive email notifications as soon as new Strava challenges are found.</p>
        
        <form id="subscribeForm">
            <div class="form-group">
                <input type="email" id="email" placeholder="Enter your email address" required autocomplete="email" />
                <button type="submit" id="submitBtn">Subscribe</button>
            </div>
        </form>
        
        <div id="message" class="message"></div>
        
        <a href="/" class="back-link">← Back to Dashboard</a>
    </div>

    <script>
        document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const submitBtn = document.getElementById('submitBtn');
            const messageEl = document.getElementById('message');
            
            const email = emailInput.value.trim();
            if (!email) return;

            // Reset state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';
            messageEl.className = 'message';
            messageEl.textContent = '';

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok) {
                    messageEl.className = 'message success';
                    messageEl.textContent = 'Successfully subscribed!';
                    emailInput.value = '';
                } else {
                    messageEl.className = 'message error';
                    messageEl.textContent = data.error || 'Failed to subscribe. Please try again.';
                }
            } catch (error) {
                messageEl.className = 'message error';
                messageEl.textContent = 'A network error occurred. Please try again later.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
            }
        });
    </script>
</body>
</html>
`;
