import React, { useEffect, useState, useRef } from "react";
import { newKitFromWeb3 } from "@celo/contractkit";
import "@celo-tools/use-contractkit/lib/styles.css";
import Web3 from "@celo/contractkit/node_modules/web3";
import BigNumber from "bignumber.js";
import erc20Abi from "./contracts/erc20.abi.json";
import crowdfunding_abi from "./contracts/Crowdfunding.abi.json";

// react notification library imports
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const celo_address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const crowdfunding_address = "0x7EC6c1FE083621ece6F75D998A060C912486AAF7";

const App = () => {
  const [loading, setloading] = useState(false);
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [campaigns, setcampaigns] = useState([]);

  // form state
  const [title, settitle] = useState("");
  const [description, setdescription] = useState("");
  const [goal, setgoal] = useState("");
  const [time, settime] = useState("");

  const ERC20_DECIMALS = 18;
  useEffect(() => {
    connectCeloWallet();
  }, []);

  const connectCeloWallet = async () => {
    if (window.celo) {
      try {
        
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];

        kit.defaultAccount = user_address;

        await setAddress(user_address);

        await setKit(kit);
        toast.success("Connected to the celo blockchain successfully");
      } catch (error) {
        console.log({ error });
        toast.error("Failed to connect to the celo blockchain")
      }
    } else {
      toast.error("Please install the celo wallet extension to use this Dapp")
    }
  };

  useEffect(() => {
    if (kit && address) {
      const contract = new kit.web3.eth.Contract(
        crowdfunding_abi,
        crowdfunding_address
      );
      setcontract(contract);
    } 
  }, [kit, address]);

  const fund_project = async (campaign_id, amount) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(erc20Abi, celo_address);

      const donation_price = BigNumber(amount)
        .shiftedBy(ERC20_DECIMALS)
        .toString();
  
      const result = await cUSDContract.methods
        .approve(crowdfunding_address, donation_price)
        .send({ from: address });
  
      await contract.methods
        .fundCampaign(campaign_id, amount)
        .send({ from: address });
        toast.success("Funded this campaign successfully")
      // return result
      await getCampaigns();
    } catch (error) {
      console.log({error})
    toast.warning("Failed to fund this project")
    }
   
  };

  const close_campaign = async (campaign_id) => {
    try {
      await contract.methods.closeCampaign(campaign_id).send({ from: address });
      toast.info("You have successfully closed the campaign")
      // return result
      await getCampaigns();
    } catch (error) {
      toast.error("failed to close project")
    }
 
  };


  // fetch all the currently running projects
  const getCampaigns = async () => {
    const length_of_campaigns = await contract.methods.totalCampaigns().call();
    console.log({ length_of_campaigns });
    const _campaigns = [];

    // start with 1 here because indexing stars from 1 in our smart contract
    for (let i = 1; i <= length_of_campaigns; i++) {
      let promise = new Promise(async (resolve, reject) => {
        let _campaign = await contract.methods.getCampaign(i).call();
        console.log({ _campaign });
        resolve({
          index: i,
          owner: _campaign[0],
          campaign_title: _campaign[1],
          campaign_description: _campaign[2],
          goal_amount: new BigNumber(_campaign[3]),
          total_amount_funded: new BigNumber(_campaign[4]),
          deadline: _campaign[5],
          isCampaignOpen: _campaign[6],
        });
      });
      _campaigns.push(promise);
    }
    const resloved_campaigns = await Promise.all(_campaigns);

    setcampaigns(resloved_campaigns);
    toast.success("Fetched updated projects")
  };

  const createCampaign = async () => {
    if (!title || !description || !goal || !time) {
      return toast.error("Please enter all fields")
    }

    await contract.methods
      .createCampaign(title, description, goal, time)
      .send({ from: address });
    // return result

    toast.success("Your project has been created successfully")
    await getCampaigns();
  };

  useEffect(() => {
    if (contract) {
      return getCampaigns();
    }
  }, [contract]);

  return (
    <div>
      {/* toast library container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* toast library container end */}

      <div className="page-wrapper">
        <div className="site_header__header_two_wrap clearfix">
          <div className="header_top_two">
            <div className="container">
              <div className="header_top_two_content clearfix">
                <div className="header_top_two_left float-left">
                  <div className="logo_box_two">
                    <a href="/" className="main-nav__logo">
                      <h2>Celo Crowdfunding</h2>
                    </a>
                  </div>
               
                </div>
              </div>
            </div>
          </div>
        </div>

  
        {/*Explore Projects One Start*/}
        <section className="explorep_projects_one projects_two">
          <div
            className="projects_two_shape"
            style={{
              backgroundImage:
                "url(assets/images/shapes/projects_tow_shape.png)",
            }}
          ></div>
          <div className="container">
            <div className="block-title text-center">
              <div className="block_title_icon">
                <img src="assets/images/icon/sec__title_two_icon.png" alt="" />
              </div>
              <p>Explore the latest Crowdfunding campaigns</p>
              <h3>Explore Campaigns</h3>
            </div>
            <div className="row">
              {campaigns.map((campaign, key) => (
                <div className="col-xl-4 col-lg-6" key={key + 1}>
                  <div className="projects_one_single projects_two_single">
                    <div className="projects_one_img">
                      <img
                        src="https://images.squarespace-cdn.com/content/v1/5ae5e31a1aef1d32d67003b6/1540742668668-8TYVSP9XB84YMWC2SU7K/Crowdfunding+Your+Small+Business+-+What+You+Need+to+Know.jpg?format=1000w"
                        alt="celo crowdfunding"
                      />
                      <div className="project_one_icon">
                        <i className="fa fa-heart" />
                      </div>
                    </div>
                    <div className="projects_one_content">
                      <div className="porjects_one_text">
                        <p>
                          <span>by </span>
                          {campaign.owner}
                        </p>
                        <h3>
                          <a href>
                            {campaign.campaign_title}
                            <br />
                          </a>
                        </h3>

                        <p style={{ color: "black" }}>
                          {campaign.campaign_description.slice(0, 100)}{" "}
                          {campaign.campaign_description.length > 100 && "..."}
                        </p>
                      </div>
                    </div>
                    <div className="projects_one_bottom">
                      <ul className="list-unstyled">
                        <li>
                          <h5>
                            {campaign.total_amount_funded.toString()} cUsd
                          </h5>
                          <p>Raised</p>
                        </li>
                        <li>
                          <h5>
                            {new BigNumber(campaign.goal_amount).toString()}{" "}
                            cUsd
                          </h5>
                          <p>Goal</p>
                        </li>
                        <li>
                          <h5>
                            {Math.floor(
                              (campaign.deadline -
                                Math.floor(Date.now() / 1000)) /
                                3600
                            )}
                          </h5>
                          <p>Hours Left</p>
                        </li>
                      </ul>
                    </div>

                    <center>
                      {campaign.isCampaignOpen ? (
                        <>
                          <form
                            onSubmit={(e) => {
                              // fund_project(key+1, e.target )
                              e.preventDefault();
                              const amount = document.getElementById(
                                `amount_${key + 1}`
                              ).value;

                              fund_project(key + 1, amount);
                            }}
                          >
                            <input
                              id={`amount_${key + 1}`}
                              style={{ marginBottom: 5 }}
                              placeholder="Amount to fund in cUSd"
                              type="number"
                              required
                            ></input>

                            <button
                              type="submit"
                              className="thm-btn cta_sign_up"
                            >
                              Fund Project
                            </button>
                          </form>

                          {campaign.owner == address &&
                            campaign.isCampaignOpen && (
                              <button
                                onClick={() => {
                                  close_campaign(key + 1);
                                }}
                                className="thm-btn  manage_one_btn"
                              >
                                Close Campaign
                              </button>
                            )}
                        </>
                      ) : (
                        <button
                          type="submit"
                          disabled
                          style={{ backgroundColor: "black" }}
                          className="thm-btn cta_sign_up"
                        >
                          Campaign Has Ended
                        </button>
                      )}
                    </center>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="cta_two"
          style={{
            backgroundImage: "url(assets/images/resources/cta_two_bg.jpg)",
          }}
        >
          <div className="container">
            <div className="row">
              <div className="col-xl-7">
                <div className="cta-two_left">
                  <h2>Create your own crowdfunding campaign</h2>
                  <p>
                    All you need to do is fill the form and your campaign will
                    be created and added to the celo blockchain.
                  </p>
                </div>
              </div>
              <div className="col-xl-5">
                <div className="cta_two_right">
                  <form
                    className="cta_two_form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createCampaign();
                    }}
                  >
                    <div className="input_box">
                      <input
                        type="text"
                        name="title"
                        required
                        onChange={(e) => {
                          settitle(e.target.value);
                        }}
                        placeholder="Campaign Title"
                      />
                    </div>
                    <div className="input_box">
                      <input
                        type="text"
                        name="description"
                        onChange={(e) => {
                          setdescription(e.target.value);
                        }}
                        required
                        placeholder="short description"
                      />
                    </div>
                    <div className="input_box">
                      <input
                        type="text"
                        name="goal"
                        required
                        onChange={(e) => {
                          setgoal(e.target.value);
                        }}
                        placeholder="Campaign Goal in cUSD"
                      />
                    </div>
                    <div className="input_box">
                      <input
                        type="text"
                        required
                        onChange={(e) => {
                          settime(e.target.value);
                        }}
                        name="period"
                        placeholder="Time for campaign to run(in days)"
                      />
                    </div>

                    <button type="submit" className="thm-btn cta_sign_up">
                      Create Campaign
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-6 col-md-6">
                <div
                  className="footer-widget__column footer-widget__about wow fadeInUp animated"
                  data-wow-delay="100ms"
                  style={{
                    visibility: "visible",
                    animationDelay: "100ms",
                    animationName: "fadeInUp",
                  }}
                >
                  <div className="footer-widget__title">
                    <h3>About</h3>
                  </div>
                  <div className="footer-widget_about_text">
                    <p>
                      Create your campaign and have it funded from all over the
                      world via the celo blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
        {/*Site Footer Bottom Start*/}
        <div className="site-footer_bottom">
          <div className="container">
            <div className="site-footer_bottom_copyright">
              <div className="site_footer_bottom_icon">
                <img
                  src="assets/images/shapes/footer-bottom-shape.png"
                  alt=""
                />
              </div>
              <p>
                @ All copyright 2021, <a href="#">dacade.com</a>
              </p>
            </div>
            <div className="site-footer__social">
              <a href="#" className="tw-clr">
                <i className="fab fa-twitter" />
              </a>
              <a href="#" className="fb-clr">
                <i className="fab fa-facebook-square" />
              </a>
              <a href="#" className="dr-clr">
                <i className="fab fa-dribbble" />
              </a>
              <a href="#" className="ins-clr">
                <i className="fab fa-instagram" />
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* /.page-wrapper */}
      <a href="#" data-target="html" className="scroll-to-target scroll-to-top">
        <i className="fa fa-angle-up" />
      </a>
    </div>
  );
};

export default App;
