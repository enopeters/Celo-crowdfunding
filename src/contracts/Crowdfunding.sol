  // SPDX-License-Identifier: MIT

pragma solidity 0.5.8;


interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract CrowdFund {


/* Requirements:
-  Anyone can create a new campaign.
-  Multiple campaigns can be created by single owner.
- Each contributor can fund multiple campaigns. 
- Each campaign status is open or closed
- Campaign owner can withdraw funds only when required funding goal has been achieved (can withdraw before deadline has passed if funding goal is achieved).
- A Campaign is closed when:
            * deadline has passed (not closed when target goal amount is reached as campaign owner can collect more funds than the initial target) or 
            * Campaign owner withdraws funds  
            * Any time by the Campaign Owner for any reason.
- Each contributor can only claim refunds:
            * if deadline has passed and the required funding goal has not been achieved or
            *  if the deadline has not passed and the required funding goal has also not been achieved but the campaign has still been closed by the owner 
*/

    address payable public owner; //owner of contract
    uint256 public totalCampaigns;//no. of campaigns
    // cusd token address
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    
    // This is a type for a single Campaign.
    struct Campaign {
        address payable campaignOwner; 
        string campaignTitle; 
        string campaignDescription;
        uint256 goalAmount; 
        uint256 totalAmountFunded;
        uint256 deadline;
        bool goalAchieved;
        bool isCampaignOpen;
        bool isExists; //campaign exists or not. Campaign once created always exists even if closed

        mapping(address => uint256) contributions;//stores amount donated by each unique contributor

    }

 
    // This declares a state variable campaigns that stores a `Campaign` struct for each unique campaign ID.
    mapping(uint256 => Campaign) campaigns;

    modifier onlyOwner {
        require(msg.sender == owner,"Only owner can call this function.");
        _;
    }

    modifier onlyCampaignOwner(uint256 _campaignID) {
        require(msg.sender == campaigns[_campaignID].campaignOwner,"Only Campaign owner can call this function.");
        _;
    }


    constructor() public  {
        owner = msg.sender;
    }

    
    //Creation of a campaign
    function createCampaign(string memory _campaignTitle, string memory _campaignDescription, uint256 _goalAmount, uint256 _fundingPeriodInDays ) public {

        require(_goalAmount > 0, 'Goal amount must be more than zero cusd!');
        require(_fundingPeriodInDays >=1 && _fundingPeriodInDays <=365, 'Funding Period should be between 1 -365 days');

        ++ totalCampaigns;//id of first campaign is 1 and not 0.

        Campaign memory aCampaign = Campaign(msg.sender,_campaignTitle,_campaignDescription,_goalAmount,0,now + (_fundingPeriodInDays * 1 days),false,true,true);
        campaigns[totalCampaigns] = aCampaign;

    }
    
    
    // get a particular Campaign
    function getCampaign(uint _index) public view returns (
        address payable,
        string memory, 
        string memory,
        uint256,
        uint256,
        uint256,
        bool
        
       
    ) {
        return ( campaigns[_index].campaignOwner,
            campaigns[_index].campaignTitle, 
            campaigns[_index].campaignDescription, 
            campaigns[_index].goalAmount, 
            campaigns[_index].totalAmountFunded,
            campaigns[_index].deadline,
            campaigns[_index].isCampaignOpen
        );
    }

    


    //Funding of a campaign
    function fundCampaign(uint256 _campaignID, uint256 _price) public payable{
 
        checkCampaignDeadline(_campaignID);
        
         require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
             campaigns[_campaignID].campaignOwner,
            _price
           
          ),
          "Donation failed."
        );

        campaigns[_campaignID].contributions[msg.sender] = (campaigns[_campaignID].contributions[msg.sender]) + _price;
        campaigns[_campaignID].totalAmountFunded = campaigns[_campaignID].totalAmountFunded + _price;

           

          //check if funding goal achieved
          if(campaigns[_campaignID].totalAmountFunded >= campaigns[_campaignID].goalAmount){
                    campaigns[_campaignID].goalAchieved = true; 

          }
    }


    //Campaign owner can close a campaign anytime
    function closeCampaign(uint256 _campaignID) public onlyCampaignOwner(_campaignID){
            campaigns[_campaignID].isCampaignOpen = false;

    }


    // Contributor can view his/her contribution details for a campaign
    function getContributions(uint256 _campaignID) public view returns(uint256 contribution){
            require(campaigns[_campaignID].isExists,'Campaign does not exists');

           return campaigns[_campaignID].contributions[msg.sender];

    }


    //To check whether a campaign deadline has passed
    function checkCampaignDeadline(uint256 _campaignID)  internal {
        
        require(campaigns[_campaignID].isExists,'Campaign does not exists');
        
        if (now > campaigns[_campaignID].deadline){
            campaigns[_campaignID].isCampaignOpen = false;//Close the campaign
        }

    }

} // close the contract