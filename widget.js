const container = document.getElementsByClassName("main-container")[0];
const alert = document.getElementsByClassName("alert")[0];
const goal = document.getElementsByClassName("goal")[0];
const progress = document.getElementsByClassName("goal-progress")[0];
const alertUser = document.getElementsByClassName("alert-user")[0];
const alertDonation = document.getElementsByClassName("alert-donation")[0];
const alertMessage = document.getElementsByClassName("alert-message")[0];
const alertIncentive = document.getElementsByClassName("alert-incentive")[0];

let donations = [],
    donationGoal = 0,
    donationSum = 0,
    donationPercent = 0,
    lastDonationDateTime = "",
    audio = new Audio("{alertSound}"),
    goalComplete = new Audio("{goalCompleteSound}"),
    goalMet = false,
    size = "{size}",
    sideDisplay = "{sideDisplay}",
    donationAmount = 5,
    twitch = "{twitch}",
    games = "{games}",
    alerts = [],
    lastRand = 0,
    incentives = [],
    maxNumIncentives = 5,
    maxNumSounds = 10,
    gameIncentives = [],
    elPing = 15000;

let playAlert = (incentiveId) => {
    console.log("Alerts enabled:", {enableAlerts})
    if ({enableAlerts} == true) {
        let soundAlert = [];
        let incentive = [];
        alertUser.innerHTML = donations[0].displayName || "Anonymous";
        alertDonation.innerHTML = "$" + donations[0].amount;

        if (donations[0].message != undefined) {
            alertMessage.innerHTML = donations[0].message.substring(0, 150) || "";
        } else {
            alertMessage.innerHTML = "";
        }

        alert.classList.add("alert-show");
        void alert.offsetWidth;
        alert.classList.remove("alert-hide");

        if (incentiveId != 0) {
            for (i = 0; i < incentives.length; i++) {
                if (incentives[i].incentiveID == incentiveId) {
                    incentive = incentives[i];
                }
            }

            for (j = 0; j < alerts.length; j++) {
                if (alerts[j].name == incentive.description) {
                    soundAlert = alerts[j];
                }
            }
    
            let rnd = randomNumber(soundAlert.sounds.length);
            let sound = new Audio(soundAlert.sounds[rnd].sound);
            console.log("Sound ", soundAlert.sounds[rnd].sound);
            sound.play();
        } else {
            if (audio.src != "undefined") {
                audio.play();
            }
        }

        setTimeout(() => {
            alert.classList.add("alert-hide");
            void alert.offsetWidth;
            alert.classList.remove("alert-show");
            alertIncentive.innerHTML = "";
        }, 8000);
    }
};

let updateProgress = (percent) => {
    if (percent > 100) {
        progress.style.height = "100%";
    } else {
        progress.style.height = percent + "%";
    }
};

let randomNumber = (numSounds) => {
    console.log("Num sounds: ", numSounds);
    let newRand = Math.floor(Math.random() * Math.floor(numSounds));

    if (newRand == lastRand && numSounds != 1) {
        newRand = randomNumber(numSounds);
    }

    lastRand = newRand;

    console.log(newRand);

    return newRand;
};

let sleep = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

let arrayColumn = (arr, n) => {
    return arr.map(x => x[n]);
};

async function getLatestDonations() {
    console.log("Date: ", donations[0].createdDateUTC);
    const response = await fetch("https://extralife.donordrive.com/api/{ExtraLifeType}/{participantId}/donations?version=1.3&where=createdDateUTC>%3D%27" + donations[0].createdDateUTC + "%27&limit=20");
    const text = await response.text();
    return JSON.parse(text);
}

async function getELDetails() {
    const response = await fetch("https://extralife.donordrive.com/api/{ExtraLifeType}/{participantId}?version=1.3&limit=20");
    const text = await response.text();
    return JSON.parse(text);
}

async function getDonations() {
    const response = await fetch("https://extralife.donordrive.com/api/{ExtraLifeType}/{participantId}/donations?version=1.3&limit=20");
    const text = await response.text();
    donations = JSON.parse(text);
}

async function getIncentives() {
    const response = await fetch("https://extralife.donordrive.com/api/{ExtraLifeType}/{participantId}/incentives?version=1.3&limit=20");
    const text = await response.text();
    incentives = JSON.parse(text);
    console.log("Incentives: ", incentives);
}

async function gameIncentive() {
    console.log("Game Incentive checked.");
    let response = await fetch('https://decapi.me/twitch/game/' + twitch);
    let game = await response.text();
  
    let gamesInc = games.split(";");
  
    if (gamesInc.includes(game)) {
        let rng = Math.floor(Math.random() * gameIncentives.length);
      
        console.log("Game: ", game);  
        alertIncentive.innerHTML = gameIncentives[rng];
    } else {
      	console.log("No game match for incentives.");
    }
}

function checkForDonation() {
    if ("{participantId}" !== "") {
        getLatestDonations().then(async (donos) => {
            for (let i = 0; i < donos.length; i++) {
                if (!arrayColumn(donations, "donationID").includes(donos[i].donationID) && donos[i].createdDateUTC >= donations[0].createdDateUTC) {
                    donations.unshift(donos[i]);
                    donationSum = donationSum + donations[0].amount;
                  
                    console.log("Dono amount: ", donations[0].amount);
                    console.log("Dono amount to fire: ", donationAmount);
                    if (donations[0].amount >= donationAmount) {
                        console.log("Game incentive should fire.");
                        gameIncentive();
                    } else {
                        console.log("Game incentive not in dono check.");
                    }

                    if (donationSum >= donationGoal && !goalMet) {
                        setTimeout(goalComplete.play(), 10000);
                        goalMet = true;
                    }

                    let percent = (donationSum / donationGoal) * 100;
                    updateProgress(percent);

                    if (donos[i].incentiveID) {
                        playAlert(donos[i].incentiveID);
                    } else {
                        playAlert(0);
                    }
                    
                    await sleep(10000);
                }
            }

            setTimeout(function () { checkForDonation(); }, elPing);
        });
    }
}

let setAlerts = (fields) => {
    for (i = 1; i <= maxNumIncentives; i++) {
        let incentive = "incentive-" + i;
        if (fields[incentive + "-name"]) {
            let sounds = [];
            for (j = 1; j <= maxNumSounds; j++) {
                if (fields[incentive + "-sound-" + j]) {
                    sounds.push({
                        "sound": fields[incentive + "-sound-" + j]
                    });
                }
            }

            alerts.push({
                "name": fields[incentive + "-name"],
                "sounds": sounds
            });
        }
    }

    console.log("Alerts: ", alerts);
}

window.addEventListener("onWidgetLoad", async function (obj) {
  	console.log("obj: ", obj);
    donationAmount = obj.detail.fieldData["donation-amount"];
    gameIncentives = obj.detail.fieldData["game-incentives"].split(";");
  console.log("Game Incentives: ", gameIncentives);
    container.classList.toggle("size-" + size);
    goal.classList.toggle("goal-" + sideDisplay);
    alert.classList.toggle("alert-" + sideDisplay);
  
    

    if ("{participantId}" !== "") {
        getELDetails().then(data => {
            donationGoal = data.fundraisingGoal;
            donationSum = data.sumDonations;

            if (donationSum >= donationGoal) {
                goalMet = true;
            }

            donationPercent = (donationSum / donationGoal) * 100;
            updateProgress(donationPercent);
            getIncentives();
            getDonations();
            setAlerts(obj.detail.fieldData);
            setTimeout(function () {
                checkForDonation();
            }, elPing);
        });
    }
});

window.addEventListener("onEventReceived", function (obj) {
    const event = obj.detail.event;

    if (event.listener === "widget-button" && event.field === "testAlert") {
        gameIncentive();
        playAlert(0);
    }
});