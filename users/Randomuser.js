// Predefined list of real usernames
const realUsernames = [
    'john_doe',
    'jane_smith',
    'mark_taylor',
    'emily_jones',
    'david_wilson',
    'sarah_brown',
    'chris_martin',
    'linda_hall',
    'michael_clark',
    'laura_white',
];

// Function to get a random real username
export function getRandomUserAndEmail() {
    const index = Math.floor(Math.random() * realUsernames.length);
    const username = realUsernames[index];
    const email = `${username}@bugbug-inbox.com`;
    return { username, email };
}
