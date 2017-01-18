const DATE_OF_DENOMINATION = new Date("2016-07-01");//the date of denomination, the constants
const DAY_OF_DENOMINATION = Math.floor(DATE_OF_DENOMINATION.getTime()/(1000*60*60*24));// we find a day since zero point
function standartDate(anyDay){// this function normalize string date into a Date object

    var anyDayA = anyDay.split("/");// we have got an array of 3 numbers in a string type
    
    var anyDATE = new Date();
        anyDATE.setFullYear(anyDayA[2]);// A means Array
        anyDATE.setMonth(anyDayA[0]-1);// we have months in range of 0...11
        anyDATE.setDate(anyDayA[1]);// anyDATE is in a correct format
        // we use format m/y/dddd

    
    return anyDATE;

}

function dataRates(){
    var ratesdbH = db.rates.find().toArray();// we accept it from the DB
    var len = ratesdbH.length;// the length of our array
    var timeDay;
    var ratesH = {};// we create a new object
    dataA = []; rateA = []; standartDateA = [];
    rateInDaysA = []; // we use this array to put rates. A number in [] brackets is the number of the day since zero point 1970
    for(var i = 0; i<len; i++){
        dataA[i] = ratesdbH[i].date;
        rateA[i] = ratesdbH[i].rate;
        standartDateA[i] = standartDate(dataA[i]);
        
        timeDay = Math.floor(standartDateA[i].getTime()/(1000*60*60*24));// we find a day since zero point
        rateInDaysA[timeDay] = rateA[i];
        // print("timeDay = " + timeDay);
        // print("rateInDaysA[timeDay] = "+ rateInDaysA[timeDay])
    }
    ratesH.data = dataA;
    ratesH.rateInDays = rateInDaysA;
    //ratesH.rate = rateA;
    ratesH.standartDate = standartDateA;
    return ratesH;
}

var ratesH = dataRates();// we have all data from DB in ratesH

function findStartData(ratesH){
    var dataA = ratesH.data;// the array with string data
    var standartDateA = ratesH.standartDate; //we have the array
    var min = standartDateA[0].getTime();
    var cycleTime;
    var num = 0;
    var len = standartDateA.length;
    for(var i=0; i<len; i++){
        cycleTime = standartDateA[i].getTime();
        if (cycleTime < min){
            min = cycleTime;
            num = i;
        } 
    }
    return dataA[num];
}

function findFinishData(ratesH){
    var dataA = ratesH.data;// the array with string data
    var standartDateA = ratesH.standartDate; //we have the array
    var max = standartDateA[0].getTime();
    var cycleTime;
    var num = 0;
    var len = standartDateA.length;
    for(var i=0; i<len; i++){
        cycleTime = standartDateA[i].getTime();
        if (cycleTime > max){
            max = cycleTime;
            num = i;
        } 
    }
    return dataA[num];
}

function calculateCashDelta(nowTimeDay){
    // cashbox is a result of the daily transactions
    // let cashboxA = [];
    // let cashboxA[0] = Byr, cashboxA[1] = Byn, cashboxA[2] = USD
    var nowData = new Date();
    nowData.setTime(nowTimeDay*1000*60*60*24);
    var cashboxA = [];//0 - Byr, 1 - Byn, 2 - USD
    cashboxA[0] = 0; cashboxA[1] = 0; cashboxA[2] = 0;
    var i = 0,
    TypeA = [],
    OperationNameA = [],
    AmountA = [],
    CurrencyA = [],
    cursor = db.transactions.find({"Date": nowData}),
    length;
        cursor.forEach(
            function(obj){
                TypeA[i] = obj.Type;// we find certain field of the certain transaction
                OperationNameA[i] = obj.OperationName;
                AmountA[i] = obj.Amount;
                CurrencyA[i] = obj.Currency;
                i++;
            }
        );
        length = TypeA.length;
        if(length>0){
            for(var j = 0; j<length; j++){
                switch(CurrencyA[j]){
                    case "Byr":
                        if(TypeA[j] === "Exp"){
                            cashboxA[0] = cashboxA[0] - AmountA[j];
                        }
                        else{
                            cashboxA[0] = cashboxA[0] + AmountA[j];
                        };
                        break;
                    case "Byn":
                        if(TypeA[j] === "Exp"){
                            cashboxA[1] = cashboxA[1] - AmountA[j];
                        }
                        else{
                            cashboxA[1] = cashboxA[1] + AmountA[j];
                        };
                        break;
                    case "Usd":
                       if(TypeA[j] === "Exp"){
                            cashboxA[2] = cashboxA[2] - AmountA[j];
                        }
                        else{
                            cashboxA[2] = cashboxA[2] + AmountA[j];
                        }; 
                }
            }

        }
        return cashboxA;
}

function exchange(nowTimeDay, ratesH, amount, fromCurrency, toCurrency, Byr, Byn, Usd){
    // amount is the volume of the fromCurency
    var fromCurency;
    var toCurrency;
    // nowTimeDay in days from zero point
    //fromCurrency = "Byr", "Byn", "Usd"
    //toCurrency = "Byr", "Byn", "Usd"
    var rate = ratesH.rateInDays[nowTimeDay]; // rate for the nowTimeDay
    var fromByr = 0; var fromByn = 0; var fromUsd = 0; // we sell it to a bank
    var toByr = 0; var toByn = 0; var toUsd = 0; // we buy it from a bank
    var exchangeResultA = []; // object for return the result of exchange operation
    // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
    // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
    if((fromCurrency === "Byr") || (fromCurrency === "Byn")){
        if(fromCurrency === "Byr"){
            fromByr = amount; toUsd = Math.round(amount/rate);
        } else{
            fromByn = amount; toUsd = Math.round(amount/rate);
        }
    }
    if((toCurrency === "Byr") || (toCurrency === "Byn")){
        if(toCurrency === "Byr"){
            fromUsd = amount; toByr = Math.round(amount*rate);
        } else{
            fromUsd = amount; toByn = Math.round(amount*rate);
        }
    }
    exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
    exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
    // print("fromByr = " + fromByr);
    // print("fromUsd = "+ fromUsd);
    // print("toByr = "+ toByr); 
    // print("toUsd = " + toUsd);
    // print("nowTimeDay = " + nowTimeDay);
    // print("amount = "+ amount);
    // print("rate = " + rate);
    return exchangeResultA;
}

function makeExchangeTransaction(nowTimeDay, Type, Category, Name, Amount, Currency, Account){
    var exchangeDate = new Date();
    exchangeDate.setTime(nowTimeDay*1000*60*60*24);// Data is in standard format
    var Type = Type;
    var Category = Category; 
    var Name = Name; 
    var Currency = Currency;
    var Account = Account;
    db.transactions.insert({"Date": exchangeDate, "Type": Type, "Category": Category, "Name": Name,
                           "Amount": Amount, "Currency": Currency, "Account": Account});
    // print("start insert");
    // print("Date = " + exchangeDate);
    // print("Type = " + Type);
    // print("Category = " + Category);
    // print("Name = " + Name);
    // print("Amount = " + Amount);
    // print("Currency = " + Currency);
    // print("Account = " + Account);
    // print("finish insert");
// we insert document into the collection
}

function ifWeNeedExchange(nowTimeDay, ratesH, Byr, Byn, Usd){
    var exchangeResultA = []; // we store the result of the exchange function
    var weNeedByr;// we need Byr to compensate the -Usd
    var weTakeByr;// we take all money to compensate a part of -Usd
    var weHaveUsd;// we buy this money when we sell "weTakeByr" money
    var weNeedUsd; // we need Usd to compensate the -Byr
    var weTakeUsd; // we take all money to compensate a part of -Byr
    var weHaveByr; // we buy this money when we sell "weTakeUsd" money
    var weNeedByn; 
    var weTakeByn;
    var weHaveByn;
    var rate = ratesH.rateInDays[nowTimeDay]; // rate for the nowTimeDay
    
    
    if(nowTimeDay < DAY_OF_DENOMINATION){
        if((Byr > 0) && (Usd < 0)){
            // print("We exchange Byr ##day is = " + nowTimeDay);
            // print("Byr is = " + Byr);
            weNeedByr = Math.round(-Usd*rate);
            // money for compensate -Usd
            if(Byr >= weNeedByr){
                // we have enough money for compensate -Usd
                exchangeResultA = exchange(nowTimeDay, ratesH, weNeedByr, "Byr", "Usd");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "ByrUsd", exchangeResultA[0], "Byr", "PurseByr");
                // expense transaction Byr
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "ByrUsd", exchangeResultA[5], "Usd", "SafeUsd");
                // incoming transaction Usd
            }
            
            if(Byr < weNeedByr){
                // we have not enough money, we will sell all Byr
                weTakeByr = Byr; // we take all Byr money
                // how many Usd we have if we sell all Byr
                exchangeResultA = exchange(nowTimeDay, ratesH, weTakeByr, "Byr", "Usd");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "ByrUsd", exchangeResultA[0], "Byr", "PurseByr");
                // expense transaction Byr
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "ByrUsd", exchangeResultA[5], "Usd", "SafeUsd");
                // incoming transaction Usd
            }
            
        }

        if ((Byr < 0) && (Usd > 0)){
            // print("We exchange Usd ##day is = " + nowTimeDay);
            // print("Usd is = " + Usd);
            weNeedUsd = Math.round(-Byr / rate);
            // money for compensate -Byr
            if(Usd >= weNeedUsd){
                // we have enough money for compensate -Byr
                exchangeResultA = exchange(nowTimeDay, ratesH, weNeedUsd, "Usd", "Byr");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "UsdByr", exchangeResultA[2], "Usd", "SafeUsd");
                // expense transaction Usd
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "UsdByr", exchangeResultA[3], "Byr", "PurseByr");
                // incoming transaction Byr
            }

            if(Usd < weNeedUsd){
                // we have not enough money, we will sell all Usd
                weTakeUsd = Usd; // we take all Usd money
                weHaveByr = Math.round(weTakeUsd * rate);
                // how many Byr we have if we sell all Usd
                exchangeResultA = exchange(nowTimeDay, ratesH, weTakeUsd, "Usd", "Byr");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "UsdByr", exchangeResultA[2], "Usd", "SafeUsd");
                // expense transaction Usd
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "UsdByr", exchangeResultA[3], "Byr", "PurseByr");
                // incoming transaction Byr
            }
        }
    }
    //// WE NEED TO WRITE THE SAME CODE FOR THE BYN AND USD!!!
    if(nowTimeDay >= DAY_OF_DENOMINATION){
        if((Byn > 0) && (Usd < 0)){
            // print("We exchangr Byn ##day is = " + nowTimeDay);
            // print("Byn is = " + Byn);
            weNeedByn = Math.round(-Usd*rate);
            // money for compensate -Usd
            if(Byn >= weNeedByn){
                // we have enough money for compensate -Usd
                exchangeResultA = exchange(nowTimeDay, ratesH, weNeedByn, "Byn", "Usd");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "BynUsd", exchangeResultA[1], "Byn", "PurseByn");
                // expense transaction Byr
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "BynUsd", exchangeResultA[5], "Usd", "SafeUsd");
                // incoming transaction Usd
            }
            
            if(Byn < weNeedByn){
                // we have not enough money, we will sell all Byr
                weTakeByn = Byn; // we take all Byr money
                // how many Usd we have if we sell all Byr
                exchangeResultA = exchange(nowTimeDay, ratesH, weTakeByn, "Byn", "Usd");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "BynUsd", exchangeResultA[1], "Byn", "PurseByn");
                // expense transaction Byr
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "BynUsd", exchangeResultA[5], "Usd", "SafeUsd");
                // incoming transaction Usd
            }
            
        }

        if ((Byn < 0) && (Usd > 0)){
            // print("We exchange Usd ##day is = " + nowTimeDay);
            // print("Usd is = " + Usd);
            weNeedUsd = Math.round(-Byn / rate);
            // money for compensate -Byr
            if(Usd >= weNeedUsd){
                // we have enough money for compensate -Byr
                exchangeResultA = exchange(nowTimeDay, ratesH, weNeedUsd, "Usd", "Byn");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "UsdByn", exchangeResultA[2], "Usd", "SafeUsd");
                // expense transaction Usd
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "UsdByn", exchangeResultA[4], "Byn", "PurseByn");
                // incoming transaction Byr
            }

            if(Usd < weNeedUsd){
                // we have not enough money, we will sell all Usd
                weTakeUsd = Usd; // we take all Usd money
                weHaveByn = Math.round(weTakeUsd * rate);
                // how many Byr we have if we sell all Usd
                exchangeResultA = exchange(nowTimeDay, ratesH, weTakeUsd, "Usd", "Byn");
                // exchangeResultA[0] = fromByr; exchangeResultA[1] = fromByn; exchangeResultA[2] = fromUsd;
                // exchangeResultA[3] = toByr; exchangeResultA[4] = toByn; exchangeResultA[5] = toUsd;
                makeExchangeTransaction(nowTimeDay, "Exp", "Exchange", "UsdByn", exchangeResultA[2], "Usd", "SafeUsd");
                // expense transaction Usd
                makeExchangeTransaction(nowTimeDay, "Inc", "Exchange", "UsdByn", exchangeResultA[4], "Byn", "PurseByn");
                // incoming transaction Byr
            }
        }
    }

}

function denominationExchange(nowTimeDay, Byr, Byn){
    var toByn = Math.floor(Byr / 10000); // we calculate the incomes, ignore if < 10000.
    var fromByr = toByn * 10000; // we take an integer fromByr
    makeExchangeTransaction(nowTimeDay, "Exp", "Denomination", "ByrByn", fromByr, "Byr", "PurseByr");
    // expense transaction Byr
    makeExchangeTransaction(nowTimeDay, "Inc", "Denomination", "ByrByn", toByn, "Byn", "PurseByn");
    // incoming transaction Byn
}

function runCashFlowPLus(begin, end){// we want to use day from the begining Day 1970
    //ratesH.data is in a string format
    var startDATE = standartDate(begin);
    var startTimeDay = Math.floor(startDATE.getTime()/(1000*60*60*24));
    var finishDATE = standartDate(end);
    var finishTimeDay = Math.floor(finishDATE.getTime()/(1000*60*60*24));
    //startTimeDay = 14610
    //finishTimeDay = 17130
    // number of the days is finishTimeDay-startTimeDay+1 = 2521
    var flowcashboxA = []; // flowcashboxA is the global cashbox, it is the cashflow
    flowcashboxA[0] = 0; flowcashboxA[1] = 0; flowcashboxA[2] = 0;
    // let cashboxA[0] = Byr, cashboxA[1] = Byn, cashboxA[2] = Usd
    var cashboxA = []; // we store the result of calculateCashDelta in it
    var preCashboxA = []; // we previously calculate the cashflow before operating currency exchange
    preCashboxA[0] = 0; preCashboxA[1] = 0; preCashboxA[2] = 0;

    for(var cycleTimeDay = startTimeDay; cycleTimeDay <= finishTimeDay; cycleTimeDay++){
        
        cashboxA = calculateCashDelta(cycleTimeDay);
        // dayCashboxA[0] = Byr; dayCashboxA[1] = Byn; dayCashboxA[2] = Usd;
        for(var i = 0; i < flowcashboxA.length; i++){
            preCashboxA[i] = flowcashboxA[i] + cashboxA[i];
            // we are calculating previously cashflow without exchange
        }
        if(cycleTimeDay === DAY_OF_DENOMINATION){
            // print("==================cycleTimeDay = " + cycleTimeDay);
            // print("=================DAY_OF_DENOMINATION = " + DAY_OF_DENOMINATION);
            // we need to transfer Byr into Byn
            denominationExchange(cycleTimeDay, preCashboxA[0], preCashboxA[1]);
            // we generate exchange transactions from Byr to Byn
        }
        // print("cycleTimeDay ---------------------- " + cycleTimeDay);
        
        ifWeNeedExchange(cycleTimeDay, ratesH, preCashboxA[0], preCashboxA[1], preCashboxA[2]); // I have no idea to use it
        // we generate the exchange transactions if we need it
        cashboxA = calculateCashDelta(cycleTimeDay);
        // cashboxA is an actual balance of the day with exchanges
        for(var j = 0; j < flowcashboxA.length; j++){
            flowcashboxA[j] = flowcashboxA[j] + cashboxA[j];
        }
        // flowcashboxA has an actual amount of money on the cycleTimeDay
        
    }
}

runCashFlowPLus(findStartData(ratesH), findFinishData(ratesH)); //start CashFlowPlus