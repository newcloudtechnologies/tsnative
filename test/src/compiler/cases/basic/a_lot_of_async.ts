function spawnObjectUsingTimers() {
    let sum = 0;

    function spawnObjects() { 
        let j={}; 
        for (let i=0;i<300;++i) { 
            j={"el":12}; 
        } 
        sum +=1;
    }   
      
    for (let j = 0; j < 500; ++j) { 
        setTimeout(spawnObjects,0); 
    }

    setTimeout(() => {console.assert(sum === 500, "All timers has been called")}, 0);
}

function spawnObjectUsingPromises() {
    let sum = 0;

    function spawnObjects() { 
        let j={}; 
        for (let i=0;i<300;++i) { 
            j={"el":12}; 
        } 
        sum +=1;
    }   
      
    const p = Promise.resolve(true);
    for (let j = 0; j < 500; ++j) { 
        p.then(spawnObjects);
    }

    p.then(() => {console.assert(sum === 500, "All timers has been called")});
}


spawnObjectUsingTimers();

// works so slow that test failed (probably killed by test framework timer)
// probaly gc cleans up promises very slow for some reason
// need to fix https://jira.ncloudtech.ru:8090/browse/TSN-585
//spawnObjectUsingPromises();