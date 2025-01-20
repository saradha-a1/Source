// Function to generate a random string of alphabetic characters
function getRandomAlphabetString(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () =>
        alphabet.charAt(Math.floor(Math.random() * alphabet.length))
    ).join('');
}

// Function to generate a realistic random name and email
export function getRandomUserAndEmail() {
    // Generate first and last names with random lengths between 3 and 8
    const firstName = getRandomAlphabetString(Math.floor(Math.random() * 6) + 3)
        .charAt(0)
        .toUpperCase() + getRandomAlphabetString(Math.floor(Math.random() * 6) + 2);
    const lastName = getRandomAlphabetString(Math.floor(Math.random() * 6) + 4)
        .charAt(0)
        .toUpperCase() + getRandomAlphabetString(Math.floor(Math.random() * 6) + 3);

    // Combine first and last names to create a username
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;

    // Create an email address based on the username
    const email = `${username}@bugbug-inbox.com`;

    return { username, email };
}

