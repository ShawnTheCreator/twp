import sys
import re

with open('frontend/src/dashboard/src/app/partner-dashboard/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add states for the form
state_injection = '''  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Activity form state
  const [messagesSent, setMessagesSent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);'''

code = code.replace('''  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);''', state_injection)

# Add submitActivity function
submit_function = '''  const handleCopyLink = () => {
    if (data?.partnerCode) {
      navigator.clipboard.writeText("https://twpublishers.co.za?ref=" + data.partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagesSent) return;
    setIsSubmitting(true);
    try {
      await api.post(\\/api/partner/activity\, { messagesSent: parseInt(messagesSent) });
      setSubmitSuccess(true);
      setMessagesSent("");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };'''

code = code.replace('''  const handleCopyLink = () => {
    if (data?.partnerCode) {
      navigator.clipboard.writeText("https://twpublishers.co.za?ref=" + data.partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };''', submit_function)

# Add form UI
ui_injection = '''        </div>

        {/* Activity Submission & Tables Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tools & Activity Form */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-4">Submit Daily Activity</h2>
              <form onSubmit={submitActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Messages Sent Today</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={messagesSent} 
                    onChange={e => setMessagesSent(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-twBlue focus:ring-0"
                    placeholder="e.g. 30"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2 bg-twBlue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : submitSuccess ? "Logged!" : "Submit Log"}
                </button>
                {submitSuccess && <p className="text-sm text-green-600 text-center font-semibold">Activity successfully logged. Streak updated!</p>}
              </form>
            </div>
          </div>

          {/* Tables */}
          <div className="lg:col-span-2 space-y-8">'''

code = code.replace('''        </div>

        {/* Tables Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">''', ui_injection)

code = code.replace('''          </div>

        </div>
      </main>''', '''          </div>

        </div>
        </div>
      </main>''') # matching the extra div from lg:col-span-2

with open('frontend/src/dashboard/src/app/partner-dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated partner dashboard")
