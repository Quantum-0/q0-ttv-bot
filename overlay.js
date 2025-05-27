const users = new Set();

const whSecret = "{whSecret}"; // Секрет вебхука
const whId = "{whId}"; // ID вебхука

const pants_raffle_timer = 60 * 1000;

let pants_timestamp = 0;
let pants_user = null;
let pants_raffle_users = null;
let pants_raffle_ts = new Map();
let pants_raffle_owned = new Map();
let pants_raffles_count = 0;
let pants_winners_count = new Map(); // user:wins_count

let is_rebellion = false;
const rebels = new Set();
let rebellion_start = 0;
const regex_rebel = /^бу+н[дт]$/i;

// TODO refactor "a" + x + "b" => `a ${x} b`

function sendMessage(text) {
    if (whSecret == "" || whId == "") return;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.mixitupapp.com/api/webhook/" + whId + "?secret=" + whSecret, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        text: text
    }));
    console.log("SEND MSG: " + text);
}

function getRandomItem(set) {
    let items = Array.from(set);
    if (items.length == 0)
        return null;
    let value = Math.floor(Math.random() * items.length);
    return items[value];
}

function getRandomUserForPantsRaffle() {
    return getRandomItem(Array.from(users).filter(x => !pants_raffle_ts.has(x) || (Date.now() - pants_raffle_ts.get(x) > 600*1000)));
}

function ChatMessageReceived(data)
{
    let msg_text = data.Message.map((msg) => msg.Content).join(' ').trim();
    let msg_sender = data.User.DisplayName;
    users.add(msg_sender);
    MsgReceived(msg_text, msg_sender);
}

function MsgReceived(msg_text, msg_sender)
{
    // Pants raffle enter
    if (msg_text.startsWith("!трусы")) {
        if (pants_user != null) {
            sendMessage("Невозможно начать новый розыгрыш трусов, пока не разыграли трусы @" + pants_user);
            return;
        }

        // User select
        if (msg_text.startsWith("!трусы @"))
        {
            let users_lower_case = new Map();
            users.forEach(value => users_lower_case.set(value.toLowerCase(), value));
            // let users_lower_case = new Map(users.map((value) => [value.toLowerCase(), value]));
            if (users_lower_case.has(msg_text.substring(8).toLowerCase()))
            {
                pants_user = users_lower_case.get(msg_text.substring(8).toLowerCase());
                // Deny reraffle is was already raffled
                if (pants_raffle_ts.has(pants_user) && ((Date.now() - pants_raffle_ts.get(pants_user)) < 600*1000)) {
                    sendMessage("Трусы @" + pants_user + " уже были недавно разыграны. Давайте позволим @" + pants_user + " сперва найти и надеть новые трусы, а потом уже разыграем их");
                    return;
                }
            }
            else {
                sendMessage("Не вижу такого пользователя :< Разыгрывать трусы можно только тех людей, кто писал в чатик ^^\"");
                return;
            }
        }
        if (pants_user == null)
            pants_user = getRandomUserForPantsRaffle();
        if (pants_user == null) {
            const min_delta = (Date.now() - Math.max(...Array.from(map.values()))) / 1000;
            sendMessage("К сожалению, все трусы текущих чатерсов были разыграны за последние 10 минут, поэтому пока нет трусов для розыгрыша :< Трусы разыграть можно будет через " + min_delta + " секунд!");
            return;
        }


        // Begin raffle
        pants_raffle_users = new Set();
        sendMessage("Внимание, объявляется розыгрыш трусов @" + pants_user + "! Ставьте плюсик в чат для участия в розыгрыше!");
        setTimeout(finishPantsRaffle, pants_raffle_timer);
    }

    // Pants raffle add user
    else if (msg_text == "+" && pants_user != null) {
        pants_raffle_users.add(msg_sender);
        if (pants_raffle_users.size == 5)
            sendMessage("Уже целых 5 человек хотят заполучить трусы @" + pants_user + "! Ничего себе! А ты пользуешься популярностью ;)");
    }

    // Pants statistics
    else if (["!трусы-стат", "!трусыстика", "!трусистика", "!трустат", "!руструсстат", "!трусокрад"].includes(msg_text.toLowerCase())) {
        const top_pants_owner = Object.entries(pants_winners_count).sort(([,a],[,b]) => b-a)[0];
        sendMessage("За сегодняшний стрим трусы успели разыграть уже " + pants_raffles_count + " раз. Больше всех трусов забирает себе @" + top_pants_owner);
    }

    // БУНД
    else if (msg_text == "!начатьбунд" || msg_text == "!начатьбунт") {
        if (is_rebellion) {
            sendMessage("Бунд уже начат, нинада новый бунд!");
            return;
        }

        rebellion_start = Date.now();
        rebels.clear();
        rebels.add(msg_sender);
        is_rebellion = true;
        sendMessage(`Пользователь @${msg_sender} начинает бунд!`);
    }
    else if (is_rebellion && regex_rebel.test(msg_text)) {
        if (rebels.has(msg_sender)) {
            // sendMessage(`@${msg_sender}, ты уже бунтуешь!`);
        }
        rebels.add(msg_sender);
    }
    else if (msg_text == "!закончитьбунт" || msg_text == "!закончитьбунд") {
        if (!is_rebellion) {
            sendMessage("Бунда не было, ты чаво!");
        } else {
            const rebels_str = Array.from(rebels).join(', ');
            sendMessage(`Бунд закончен. Чатик бунтовал ${(Date.now() - rebellion_start) / 1000} секунд. В бунте приняли участие ${rebels.size} пчеловек. Вот они: ${rebels_str}`);
            is_rebellion = false;
        }
    }
}

function finishPantsRaffle()
{
    pants_raffles_count++;

    // No joined users
    if (pants_raffle_users.size == 0) {
        sendMessage("Розыгрыш окончен! Но, к сожалению, никто не принял участие в розыгрыше твоих трусов, @" + pants_user + ", поэтому они остаются при тебе :с");
        // Erase data
        pants_user = null;
        pants_raffle_users = null;

        return;
    }

    const count = pants_raffle_users.size
    if (count === 1)
        sendMessage("Розыгрыш трусов окончен! В нашей лотерее принял участие аж целый " + count + " человек! Время объявлять победителя! Итак.. Трусы @" + pants_user + " сегодня получааааает... *барабанная дробь*");
    else if (count >= 1 && count <= 4)
        sendMessage("Розыгрыш трусов окончен! В нашей лотерее приняло участие аж целых " + count + " человека! Время объявлять победителя! Итак.. Трусы @" + pants_user + " сегодня получааааает... *барабанная дробь*");
    else if (count >= 5)
        sendMessage("Розыгрыш трусов окончен! В нашей лотерее приняло участие аж целых " + count + " человек! Время объявлять победителя! Итак.. Трусы @" + pants_user + " сегодня получааааает... *барабанная дробь*");

    // Choose winner
    let pants_winner = getRandomItem(pants_raffle_users);
    let raffle_win_text = "";

    // Send message about winner
    if (pants_winner == pants_user)
        raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем собственных трусов! Надевай их скорее обратно! И больше не снимай!";
    else
        raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем трусов " + pants_user + "!";
    setTimeout(function() {
        sendMessage(raffle_win_text);
    }, 3000);

    // Update maps
    pants_raffle_ts.set(pants_user, Date.now())
    pants_raffle_owned.set(pants_user, pants_winner);
    if (!pants_winners_count.has(pants_winner))
        pants_winners_count.set(pants_winner, 1);
    else
        pants_winners_count.set(pants_winner, pants_winners_count.get(pants_winner) + 1);

    // Erase data
    pants_user = null;
    pants_raffle_users = null;
}
