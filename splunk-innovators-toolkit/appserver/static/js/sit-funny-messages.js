/**
 * Splunk Innovators Toolkit - Funny Messages
 * 100 randomized messages for modals and dialogs
 * Version: 1.0.0
 */

define([], function() {
    'use strict';

    var funnyMessages = {
        // Modal titles (for welcome/example modals)
        titles: [
            "Well, Hello There!",
            "Look Who Clicked!",
            "Achievement Unlocked!",
            "A Wild Modal Appears!",
            "You Found Me!",
            "Surprise!",
            "Plot Twist!",
            "Breaking News!",
            "Alert Alert!",
            "Incoming Transmission!",
            "Beep Boop!",
            "Houston, We Have a Modal!",
            "The Modal Awakens",
            "Modal of the Day",
            "Special Delivery!",
            "Ding Dong!",
            "Knock Knock!",
            "Ta-Da!",
            "Voilà!",
            "Abracadabra!"
        ],

        // Modal body content messages
        content: [
            "Congratulations! You've successfully clicked a button. Your parents would be so proud.",
            "This modal is brought to you by caffeine and questionable life choices.",
            "If you're reading this, you're officially a Splunk Innovator. No take-backs.",
            "Fun fact: This modal was coded at 2 AM. Can you tell?",
            "You've discovered our secret modal! Just kidding, it's not that secret.",
            "This is a test modal. This is only a test. If this were a real emergency, you'd be running.",
            "Warning: Prolonged exposure to Splunk dashboards may cause spontaneous data analysis.",
            "Remember: With great Splunk power comes great responsibility... and great dashboards.",
            "You're doing amazing, sweetie! - Your Modal",
            "Plot twist: The real treasure was the modals we clicked along the way.",
            "Did you know? Splunk spelled backwards is 'knulpS'. You're welcome.",
            "This modal self-destructs in 5... 4... just kidding, click the X.",
            "You've been visited by the Modal of Good Fortune. Uptime will come to you.",
            "Error 418: I'm a teapot. Just kidding, everything's fine!",
            "Welcome to Modal Club. First rule of Modal Club: Always close your modals.",
            "If you can read this, you don't need glasses. Congratulations!",
            "This modal contains 100% recycled electrons.",
            "No data was harmed in the making of this modal.",
            "Powered by coffee, dreams, and a suspicious amount of regex.",
            "This modal has been certified organic and free-range.",
            "You've earned 10 imaginary points! Spend them wisely.",
            "Behind every great dashboard is someone who forgot to close their modals.",
            "May your queries be fast and your indexes be complete.",
            "This modal is gluten-free, dairy-free, and bug-free (probably).",
            "Congratulations! You're the 1,000,000th person to click this button! *",
            "* Terms and imaginary conditions apply.",
            "Fun fact: Clicking modals burns approximately 0.0001 calories.",
            "This message will self-destruct after you close it. Dramatically.",
            "You've unlocked: The ability to close this modal! Use it wisely.",
            "In a world of dashboards, be a modal.",
            "I'm not saying you're special, but you did click this button.",
            "This modal sponsored by: Your Curiosity™",
            "Breaking: Local user successfully operates modal. Film at 11.",
            "Your daily reminder that you're awesome. Now close this modal.",
            "This is what peak performance looks like. A modal. You're welcome.",
            "Legend says if you close this modal fast enough, you get a cookie. 🍪",
            "Spoiler alert: The modal was inside you all along.",
            "This modal is best enjoyed with headphones. Just kidding, it's silent.",
            "You've discovered the modal! Your search-fu is strong.",
            "Warning: This modal may contain traces of humor.",
            "If this modal was helpful, please remember to tip your developer.",
            "This modal runs on hopes, dreams, and valid JSON.",
            "Congratulations on your excellent clicking skills!",
            "This modal was lovingly crafted by sleep-deprived developers.",
            "You're viewing this modal in stunning high definition!",
            "Achievement: First Modal! Only 99 more to go.",
            "This is the modal you're looking for. *waves hand*",
            "Error: Too awesome to display. Showing this instead.",
            "Loading witty content... Done! This is it.",
            "Welcome to the future of clicking things!",
            "You have successfully proven you can click. Gold star!",
            "This modal is eco-friendly: 100% digital, 0% paper.",
            "Brought to you by the letter 'M' and the number '1'.",
            "This space intentionally left hilarious.",
            "You've reached the modal. The modal has reached you.",
            "Warning: Side effects may include improved Splunk knowledge.",
            "This modal approved by 4 out of 5 developers.",
            "Fun fact: You're now slightly better at Splunk. You're welcome.",
            "Insert inspirational quote here. Or just close the modal.",
            "Roses are red, violets are blue, this is a modal, and it's just for you.",
            "This modal is 100% certified awesome.",
            "You've activated my trap card! Just kidding, it's a modal.",
            "Welcome to Modals Anonymous. The first step is clicking.",
            "If you close this modal, another one will take its place. Circle of life.",
            "This modal contains the meaning of life. JK, it's just text.",
            "Congratulations! You've read 80% of this modal. Keep going!",
            "This modal is brought to you by: People Who Click Things™",
            "You're not stuck in traffic, you're part of a modal.",
            "This modal is under new management. Same great taste.",
            "Breaking: User clicks modal, world continues spinning.",
            "This is not the modal you... wait, yes it is.",
            "Welcome! Your opinion matters! (Results may vary)",
            "This modal powered by renewable snacks.",
            "You've earned: The satisfaction of clicking things.",
            "This modal has been viewed by dozens of people. Dozens!",
            "Warranty void if modal is not closed within 24 hours.",
            "This modal is part of a complete breakfast.",
            "You're viewing modal version 1.0.0. Collector's edition!",
            "This modal made possible by viewers like you.",
            "Caution: Modal may be closer than it appears.",
            "This modal has no artificial colors or flavors.",
            "You've discovered a modal! +10 XP",
            "This modal is vegan-friendly.",
            "Welcome to the modal that welcomes you!",
            "This modal has been safety tested by professionals.",
            "Contains 100% of your daily recommended modal intake.",
            "This modal best served at room temperature.",
            "Warning: Modal may contain awesome.",
            "You're now officially a modal expert. Put it on your resume.",
            "This modal washes, dries, and folds itself. Just kidding.",
            "Congratulations on your commitment to clicking things!",
            "This modal sponsored by the Modal Appreciation Society.",
            "You've earned: Bragging rights for finding this modal.",
            "This modal has been pre-approved for your viewing pleasure.",
            "Warning: Closing this modal may cause productivity.",
            "This modal is better than the last modal. Trust us.",
            "You're viewing a limited edition modal! (Edition of infinity)",
            "This modal wants you to know you're doing great.",
            "Breaking: Local modal thrilled to be clicked. More at 11.",
            "This modal has achieved sentience. Just kidding... or am I?",
            "You've unlocked: This Modal! (It's the only reward. Enjoy!)"
        ],

        // Confirm dialog messages
        confirmMessages: [
            "Are you absolutely, positively, 100% sure about this?",
            "Think about it... Are you really sure?",
            "This is your last chance to back out. No pressure!",
            "To click or not to click, that is the question.",
            "Are you sure? My pet goldfish needs to know.",
            "Proceeding will make you 10% cooler. Probably. Not guaranteed.",
            "This action cannot be undone. Neither can your haircut from 2010.",
            "Are you ready to take this step? Deep breaths!",
            "Once you confirm, there's no going back. Okay, there is, but still!",
            "Are you sure? The suspense is killing me!",
            "By confirming, you agree to be awesome. Terms apply.",
            "This is a big decision. Take your time. We'll wait.",
            "Are you certain? Like, math-certain?",
            "Press confirm to accept your destiny!",
            "This action requires courage. Do you have what it takes?",
            "Warning: Confirming may lead to satisfaction.",
            "Are you ready? Born ready? Just woke up ready?",
            "To confirm is human. To cancel is also human. Choose wisely.",
            "This decision will echo through eternity! Or just this session.",
            "Are you sure? Double-check sure? Triple-check sure?"
        ],

        // Alert titles
        alertTitles: [
            "Important Announcement!",
            "Attention Please!",
            "News Flash!",
            "Quick Update!",
            "FYI!",
            "Heads Up!",
            "Note to Self!",
            "PSA!",
            "Breaking News!",
            "Hot Take!"
        ],

        // Alert messages
        alertMessages: [
            "This is a friendly reminder that you're awesome!",
            "Just wanted to say hi. Hi!",
            "Everything is fine. This is fine. We're all fine here.",
            "This alert has no purpose other than to exist. How existential!",
            "You've been alerted! Feel alerted!",
            "This is a test. If this were a real alert, it would be more alarming.",
            "Nothing to see here, move along... unless you want to stay!",
            "This alert is just checking in. How are you doing?",
            "Alert: You're still here! That's dedication!",
            "This message will now self-destruct. Not really, just close it."
        ],

        // Success modal messages
        successMessages: [
            "You did it! We always believed in you!",
            "Success! Time to celebrate! 🎉",
            "Nailed it! You're basically a wizard now.",
            "Achievement unlocked: Awesome Person!",
            "Success! Your future self thanks you.",
            "You've successfully succeeded at being successful!",
            "Boom! That worked! Who's surprised? Not us!",
            "Victory! Sweet, sweet victory!",
            "You're on fire! Metaphorically. Please don't actually be on fire.",
            "Success! Now go treat yourself!"
        ],

        // Get random item from array
        getRandom: function(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },

        // Get random title
        getRandomTitle: function() {
            return this.getRandom(this.titles);
        },

        // Get random content
        getRandomContent: function() {
            return this.getRandom(this.content);
        },

        // Get random confirm message
        getRandomConfirm: function() {
            return this.getRandom(this.confirmMessages);
        },

        // Get random alert title
        getRandomAlertTitle: function() {
            return this.getRandom(this.alertTitles);
        },

        // Get random alert message
        getRandomAlert: function() {
            return this.getRandom(this.alertMessages);
        },

        // Get random success message
        getRandomSuccess: function() {
            return this.getRandom(this.successMessages);
        },

        // Get a complete random modal config
        getRandomModal: function() {
            return {
                title: this.getRandomTitle(),
                content: '<p>' + this.getRandomContent() + '</p>'
            };
        }
    };

    return funnyMessages;
});
