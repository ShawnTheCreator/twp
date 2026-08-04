import re

with open('Program.cs', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all classes inserted in the middle of top level statements
classes_to_move = []

patterns = [
    r'class InviteRequest \{ [^\}]+\}',
    r'class SignupRequest \{ [^\}]+\}',
    r'class ForgotPasswordRequest \{ [^\}]+\}',
    r'class ResetPasswordRequest \{ [^\}]+\}',
    r'class MfaLoginRequest \{ [^\}]+\}',
    r'class VerifyMfaRequest \{ [^\}]+\}'
]

for p in patterns:
    match = re.search(p, content)
    if match:
        classes_to_move.append(match.group(0))
        content = content.replace(match.group(0), '')

# Append to the end of the file
content += '\n\n' + '\n'.join(classes_to_move)

with open('Program.cs', 'w', encoding='utf-8') as f:
    f.write(content)
